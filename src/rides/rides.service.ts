import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RideSession, RideSessionType, RideStatus } from './entities/ride-session.entity';

@Injectable()
export class RidesService {
  constructor(
    @InjectRepository(RideSession)
    private rideRepository: Repository<RideSession>,
  ) {}

  async createSession(data: { userId: string; courseId?: string; sessionType?: RideSessionType }): Promise<RideSession> {
    const session = this.rideRepository.create({
      userId: data.userId,
      courseId: data.courseId,
      sessionType: data.sessionType || RideSessionType.SOLO,
      status: RideStatus.ACTIVE,
      startedAt: new Date(),
    } as any);
    return this.rideRepository.save(session as any);
  }

  async findById(id: string): Promise<RideSession> {
    const session = await this.rideRepository.findOne({ where: { id: id as any } });
    if (!session) throw new NotFoundException('Ride session not found');
    return session as any;
  }

  async updateData(userId: string, data: { power?: number; heartRate?: number; cadence?: number; speed?: number }): Promise<RideSession> {
    const session = await this.rideRepository.findOne({ where: { userId: userId as any, status: RideStatus.ACTIVE as any } });
    if (!session) throw new NotFoundException('No active session');
    const timestamp = Date.now();
    if (data.power) {
      (session as any).powerCurve = [...(session.powerCurve || []), [timestamp, data.power] as [number, number]].slice(-3600);
    }
    if (data.heartRate) {
      (session as any).heartRateCurve = [...(session.heartRateCurve || []), [timestamp, data.heartRate] as [number, number]].slice(-3600);
    }
    return this.rideRepository.save(session as any);
  }

  async finishSession(userId: string): Promise<RideSession> {
    const session = await this.rideRepository.findOne({ where: { userId: userId as any, status: RideStatus.ACTIVE as any } });
    if (!session) throw new NotFoundException('No active session');
    (session as any).endedAt = new Date();
    (session as any).status = RideStatus.COMPLETED;
    return this.rideRepository.save(session as any);
  }

  calculateWKg(power: number, weight: number): number {
    if (!weight) return 0;
    return Number((power / weight).toFixed(2));
  }
}
