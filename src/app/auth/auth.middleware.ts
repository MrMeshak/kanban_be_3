import { Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as cookie from 'cookie';
import { ITokenPayload } from 'jsonwebtoken';
import { JwtExpiry, JwtService } from '../../utils/jwt/jwt.service';
import { UserService } from '../user/user.service';
import { UserStatus } from '../user/entity/user.entity';
import { RedisPrefix, RedisService } from '../../redis/redis.service';

export enum AuthStatus {
  NONE = 'NONE',
  AUTHENTICATED = 'AUTHENTICATED',
  MISSING_TOKEN = ' MISSING_TOKEN',
  INVALID_AUTH_TOKEN = 'INVALID_AUTH_TOKEN',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
  AUTH_REFRESH_MISMATCH = 'AUTH_REFRESH_MISMATCH',
  REFRESH_TOKEN_REUSED = 'REFRESH_TOKEN_REUSED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_SUSPENDED = 'USER_SUSPENDED',
}

export interface AuthContext {
  userId?: string;
  authStatus: AuthStatus;
  message: string;
  setNewTokens: boolean;
}

export interface RequestWithAuthContext extends Request {
  authContext: AuthContext;
}

export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly userService: UserService,
  ) {}

  async use(req: RequestWithAuthContext, res: Response, next: NextFunction) {
    this.logger.log(AuthMiddleware.name);

    req.authContext = {
      userId: undefined,
      authStatus: AuthStatus.NONE,
      message: '',
      setNewTokens: false,
    };

    const cookies = cookie.parse(req.headers.cookie ?? '');
    const authToken: string = cookies['authToken'];
    const refreshToken: string = cookies['refreshToken'];
    this.logger.log('authToken', authToken);

    if (!authToken || !refreshToken) {
      req.authContext = {
        userId: undefined,
        authStatus: AuthStatus.MISSING_TOKEN,
        message: 'missing authToken or refreshToken',
        setNewTokens: false,
      };
      return next();
    }

    let decodedAuthToken: ITokenPayload;
    try {
      decodedAuthToken = this.jwtService.verifyAuthToken(authToken, {
        ignoreExpiration: true,
      });
    } catch (err) {
      req.authContext = {
        userId: undefined,
        authStatus: AuthStatus.INVALID_AUTH_TOKEN,
        message: 'invalid authToken',
        setNewTokens: false,
      };
      return next();
    }

    const userId = decodedAuthToken.sub;
    if (decodedAuthToken.exp * 1000 > Date.now()) {
      req.authContext = {
        userId: userId,
        authStatus: AuthStatus.AUTHENTICATED,
        message: 'authenticated',
        setNewTokens: false,
      };
      return next();
    }

    let decodedRefreshToken: ITokenPayload;
    try {
      decodedRefreshToken = this.jwtService.verifyRefreshToken(refreshToken);
    } catch (err) {
      req.authContext = {
        userId: undefined,
        authStatus: AuthStatus.INVALID_REFRESH_TOKEN,
        message: 'invalid refreshToken',
        setNewTokens: false,
      };
      return next();
    }

    if (decodedRefreshToken.sub !== authToken) {
      req.authContext = {
        userId: undefined,
        authStatus: AuthStatus.AUTH_REFRESH_MISMATCH,
        message: 'authToken and refreshToken mismatch',
        setNewTokens: false,
      };
      return next();
    }

    const storedRefreshToken = await this.redisService.get(
      RedisPrefix.RefreshToken,
      userId,
    );

    if (refreshToken !== storedRefreshToken) {
      await this.redisService.delete(RedisPrefix.RefreshToken, userId);
      req.authContext = {
        userId: undefined,
        authStatus: AuthStatus.REFRESH_TOKEN_REUSED,
        message: 'refreshToken has already been used',
        setNewTokens: false,
      };
      return next();
    }

    const user = await this.userService.findUserById(userId);

    if (!user) {
      req.authContext = {
        userId: undefined,
        authStatus: AuthStatus.USER_NOT_FOUND,
        message: 'user could not be found',
        setNewTokens: false,
      };
      return next();
    }

    if (user.userStatus === UserStatus.SUSPENDED) {
      req.authContext = {
        userId: undefined,
        authStatus: AuthStatus.USER_SUSPENDED,
        message: 'user suspended',
        setNewTokens: false,
      };
      return next();
    }

    const newAuthToken = this.jwtService.createAuthToken(userId);
    const newRefreshToken = this.jwtService.createRefreshToken(authToken);
    await this.redisService.set(
      RedisPrefix.RefreshToken,
      userId,
      newRefreshToken,
    );
    res.setHeader('Set-Cookie', [
      cookie.serialize('authToken', newAuthToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
        maxAge: JwtExpiry.AUTH_TOKEN_EXPIRY,
      }),
      cookie.serialize('refreshToken', newRefreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
        maxAge: JwtExpiry.REFRESH_TOKEN_EXPIRY,
      }),
    ]);

    req.authContext = {
      userId: userId,
      authStatus: AuthStatus.AUTHENTICATED,
      message: 'authenticated',
      setNewTokens: true,
    };

    return next();
  }
}
