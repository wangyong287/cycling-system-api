import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachesController, AdminCoachesController } from './coaches.controller';
import { CoachesService } from './coaches.service';
import { Coach, Role, CoachPermission } from './entities/coach.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Coach, Role, CoachPermission])],
  controllers: [CoachesController, AdminCoachesController],
  providers: [CoachesService],
  exports: [CoachesService],
})
export class CoachesModule {}