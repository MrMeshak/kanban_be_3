import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { RedisModule } from '../../redis/redis.module';
import { JwtModule } from '../../utils/jwt/jwt.module';

@Module({
  imports: [JwtModule, RedisModule, UserModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
