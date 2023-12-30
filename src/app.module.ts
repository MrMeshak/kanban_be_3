import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthMiddleware } from './app/auth/auth.middleware';
import { AuthModule } from './app/auth/auth.module';
import { TaskModule } from './app/task/task.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from './utils/jwt/jwt.module';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './app/user/user.module';

@Module({
  imports: [
    MikroOrmModule.forRoot(),
    ConfigModule.forRoot(),
    JwtModule,
    RedisModule,
    UserModule,
    AuthModule,
    TaskModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
