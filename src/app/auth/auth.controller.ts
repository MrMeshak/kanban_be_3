import * as cookie from 'cookie';
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { JwtExpiry } from 'src/utils/jwt/jwt.service';
import {
  AlreadyExistsError,
  InvalidCredentialsError,
  NotFoundError,
} from 'src/utils/base/errors';
import { RequestWithAuthContext } from './auth.middleware';

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
  logout(@Res() res: Response) {
    res.clearCookie('authToken');
    res.clearCookie('refreshToken');
    res.status(HttpStatus.NO_CONTENT).send();
  }

  @Get('/me')
  async me(@Req() req: RequestWithAuthContext) {
    const { userId } = req.authContext;
    console.log(req.authContext);
    if (!userId) {
      throw new UnauthorizedException();
    }
    const user = this.authService.me(userId);
    if (!user) {
      throw new NotFoundException('User could not be found');
    }
    return user;
  }
}
