import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { DevicesModule } from './devices/devices.module';
import { RidesModule } from './rides/rides.module';
import { PetsModule } from './pets/pets.module';
import { PointsModule } from './points/points.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { OrdersModule } from './orders/orders.module';
import { CoachesModule } from './coaches/coaches.module';
import { PlansModule } from './plans/plans.module';
import { SnakeNamingStrategy } from './config/snake-naming.strategy';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM配置
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'password'),
        database: config.get('DB_DATABASE', 'cycling'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        namingStrategy: new SnakeNamingStrategy(),
        synchronize: config.get('DB_SYNCHRONIZE', 'false') === 'true',
        logging: config.get('DB_LOGGING', false) === 'true',
        ssl:
          config.get('DB_SSL', 'false') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),

    // 功能模块
    AuthModule,
    UsersModule,
    CoursesModule,
    DevicesModule,
    RidesModule,
    PetsModule,
    PointsModule,
    SubscriptionsModule,
    OrdersModule,
    CoachesModule,
    PlansModule,
  ],
})
export class AppModule {}