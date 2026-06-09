import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RidesService } from './rides.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ride',
})
export class RideGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private activeRides = new Map<string, Map<string, any>>();
  private userSockets = new Map<string, string>();

  constructor(
    private ridesService: RidesService,
    private usersService: UsersService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // 清理用户连接
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; courseId: string },
  ) {
    const { userId, courseId } = data;

    // 验证用户
    const user = await this.usersService.findById(userId);
    if (!user) {
      return { error: '用户不存在' };
    }

    // 创建骑行会话
    const session = await this.ridesService.createSession({
      userId,
      courseId,
    });

    // 保存连接映射
    this.userSockets.set(userId, client.id);

    // 初始化课程房间
    if (!this.activeRides.has(courseId)) {
      this.activeRides.set(courseId, new Map());
    }
    this.activeRides.get(courseId).set(userId, {
      socketId: client.id,
      sessionId: session.id,
      power: 0,
      heartRate: 0,
      cadence: 0,
      calories: 0,
      ranking: 0,
    });

    // 加入房间
    client.join(courseId);

    // 广播用户加入
    client.to(courseId).emit('user_joined', { userId, nickname: user.nickname });

    return {
      sessionId: session.id,
      courseId,
      ftp: user.ftp,
      wKg: user.wKg,
    };
  }

  @SubscribeMessage('ride_data')
  async handleRideData(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      userId: string;
      courseId: string;
      power: number;
      heartRate: number;
      cadence: number;
    },
  ) {
    const { userId, courseId, power, heartRate, cadence } = data;

    // 获取用户FTP
    const user = await this.usersService.findById(userId);
    const ftp = user?.ftp || 300;

    // 计算FTP百分比
    const ftpPercent = ftp ? Math.round((power / ftp) * 100) : 0;

    // 更新用户数据
    const courseData = this.activeRides.get(courseId);
    if (courseData && courseData.has(userId)) {
      const userData = courseData.get(userId);
      userData.power = power;
      userData.heartRate = heartRate;
      userData.cadence = cadence;
      userData.calories += Math.round(power * 0.0143); // 粗略估算

      // 计算排名
      const users = Array.from(courseData.values());
      users.sort((a, b) => b.power - a.power);
      userData.ranking = users.findIndex((u) => u.socketId === client.id) + 1;

      // 保存到数据库（每5秒）
      // await this.ridesService.updateData(userData.sessionId, { power, heartRate, cadence });
    }

    // 广播给课程内所有人
    this.server.to(courseId).emit('ride_update', {
      userId,
      power,
      ftpPercent,
      heartRate,
      cadence,
      ranking: courseData?.get(userId)?.ranking || 0,
    });

    return { received: true };
  }

  @SubscribeMessage('section_change')
  handleSectionChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { courseId: string; section: any },
  ) {
    const { courseId, section } = data;
    // 广播环节变化
    this.server.to(courseId).emit('section_changed', section);
  }

  @SubscribeMessage('leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; courseId: string },
  ) {
    const { userId, courseId } = data;

    // 离开房间
    client.leave(courseId);

    // 清理数据
    const courseData = this.activeRides.get(courseId);
    if (courseData) {
      courseData.delete(userId);
      if (courseData.size === 0) {
        this.activeRides.delete(courseId);
      }
    }
    this.userSockets.delete(userId);

    // 结束骑行会话
    await this.ridesService.finishSession(userId);

    // 广播用户离开
    this.server.to(courseId).emit('user_left', { userId });
  }

  // 获取房间内排名
  getRankings(courseId: string) {
    const courseData = this.activeRides.get(courseId);
    if (!courseData) return [];

    const users = Array.from(courseData.entries()).map(([userId, data]) => ({
      userId,
      power: data.power,
      ranking: data.ranking,
    }));

    return users.sort((a, b) => b.power - a.power);
  }
}