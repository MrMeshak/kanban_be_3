import * as cookie from 'cookie';
import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthService, InvalidCredentialsError } from './auth.service';
import { Response } from 'express';
import { JwtExpiry } from 'src/utils/jwt/jwt.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log(data);
    try {
      const { authToken, refreshToken } = await this.authService.login(data);
      res.setHeader('Set-Cookie', [
        cookie.serialize('authToken', authToken, {
          httpOnly: true,
          sameSite: 'strict',
          secure: true,
          maxAge: JwtExpiry.AUTH_TOKEN_EXPIRY,
        }),
        cookie.serialize('refreshToken', refreshToken, {
          httpOnly: true,
          sameSite: 'strict',
          secure: true,
          maxAge: JwtExpiry.REFRESH_TOKEN_EXPIRY,
        }),
      ]);

      return { data, status: HttpStatus.OK };
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        throw new HttpException(err.message, HttpStatus.UNAUTHORIZED);
      }
    }
  }

  @Post('signup')
  signup(data: SignupDto) {}
}
