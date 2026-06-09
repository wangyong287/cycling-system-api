import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
  ) {}

  async findByUserId(userId: string): Promise<Device[]> {
    return this.deviceRepository.find({ where: { userId } });
  }

  async bind(userId: string, data: Partial<Device>): Promise<Device> {
    const device = this.deviceRepository.create({ ...data, userId });
    return this.deviceRepository.save(device);
  }
}