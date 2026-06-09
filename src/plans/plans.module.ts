import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { UserPlan } from './entities/user-plan.entity';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, UserPlan])],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService, TypeOrmModule],
})
export class PlansModule {}
