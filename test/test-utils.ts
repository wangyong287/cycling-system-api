import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

// 基础测试配置
export const TestUtils = {
  app: null as INestApplication,
  
  // 初始化测试应用
  async initApp() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    this.app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await this.app.init();
    return this.app;
  },

  // 清理测试应用
  async closeApp() {
    if (this.app) {
      await this.app.close();
    }
  },

  // 生成测试Token
  generateToken(userId: string = '1'): string {
    // 实际项目中应该调用JWT服务生成
    return 'mock-jwt-token';
  },
};

// 测试数据生成器
export const TestData = {
  // 用户数据
  user: {
    phone: '13800000001',
    password: 'test123',
    nickname: '测试用户',
    ftp: 300,
    weight: 70,
    lthr: 185,
  },

  // 课程数据
  course: {
    title: '测试课程',
    description: '这是一个测试课程',
    duration: 45,
    difficulty: '进阶',
    sections: [
      { name: '热身', type: 'warmup', duration: 300, powerRange: [80, 120] },
      { name: '爬坡', type: 'climb', duration: 480, powerRange: [120, 200] },
      { name: '冲刺', type: 'sprint', duration: 120, powerRange: [300, 400] },
    ],
  },

  // 骑行数据
  ride: {
    power: 325,
    heartRate: 145,
    cadence: 92,
    calories: 582,
  },

  // 订阅套餐数据
  subscriptionPlan: {
    name: '年卡',
    price: 568,
    duration: 365,
    durationType: 'day',
  },
};

// HTTP请求辅助函数
export class HttpHelper {
  constructor(private app: INestApplication) {}

  get(endpoint: string, token?: string) {
    const req = request(this.app.getHttpServer()).get(endpoint);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  }

  post(endpoint: string, body: any, token?: string) {
    const req = request(this.app.getHttpServer()).post(endpoint).send(body);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  }

  put(endpoint: string, body: any, token?: string) {
    const req = request(this.app.getHttpServer()).put(endpoint).send(body);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  }

  delete(endpoint: string, token?: string) {
    const req = request(this.app.getHttpServer()).delete(endpoint);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req;
  }
}