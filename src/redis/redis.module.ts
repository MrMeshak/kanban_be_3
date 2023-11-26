import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { redisClientFactory } from '../redis/redisCLient.factory';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [RedisService, redisClientFactory],
  exports: [RedisService],
})
export class RedisModule {}
