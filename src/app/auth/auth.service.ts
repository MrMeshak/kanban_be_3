import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from 'src/utils/jwt/jwt.service';
import { RedisPrefix, RedisService } from 'src/redis/redis.service';
import { InvalidCredentialsError } from 'src/utils/base/errors';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async login(data: LoginDto) {
    const user = await this.userService.findUserByEmail(data.email);

    if (!user) {
      throw new InvalidCredentialsError('Email or Password are invalid');
    }

    const match = await bcrypt.compare(data.password, user.password);

    if (!match) {
      throw new InvalidCredentialsError('Email or Password are invalid');
    }

    const authToken = this.jwtService.createAuthToken(user.id);
    const refreshToken = this.jwtService.createRefreshToken(authToken);
    await this.redisService.set(
      RedisPrefix.RefreshToken,
      user.id,
      refreshToken,
    );
    console.log(user);
    return {
      user,
      authToken,
      refreshToken,
    };
  }

  async signup(data: SignupDto) {
    const user = await this.userService.createUser(data);
    return user;
  }
}
