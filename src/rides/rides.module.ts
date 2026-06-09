import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RideGateway } from './ride.gateway';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { RideSession } from './entities/ride-session.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([RideSession]), UsersModule],
  controllers: [RidesController],
  providers: [RideGateway, RidesService],
  exports: [RidesService],
})
export class RidesModule {}