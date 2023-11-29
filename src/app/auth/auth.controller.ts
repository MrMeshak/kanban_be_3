import * as cookie from 'cookie';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { JwtExpiry } from 'src/utils/jwt/jwt.service';
import {
  AlreadyExistsError,
  InvalidCredentialsError,
} from 'src/utils/base/errors';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { user, authToken, refreshToken } = await this.authService.login(
        data,
      );
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

      res.status(HttpStatus.OK);
      return user;
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        throw new HttpException(err.message, HttpStatus.UNAUTHORIZED, {
          cause: err,
        });
      }
    }
  }

  @Post('/signup')
  async signup(@Body() data: SignupDto) {
    try {
      const user = await this.authService.signup(data);
      console.log(user);
      return user;
    } catch (err) {
      if (err instanceof AlreadyExistsError) {
        throw new HttpException(err.message, HttpStatus.CONFLICT, {
          cause: err,
        });
      }
      console.log(err);
    }
  }

  @Post('/logout')
  logout(@Res() res: Response) {}
}
