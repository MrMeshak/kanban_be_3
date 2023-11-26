import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RequestWithAuthContext } from './auth.middleware';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  canActivate(context: ExecutionContext) {
    this.logger.log(AuthGuard.name);
    const req = context.switchToHttp().getRequest<RequestWithAuthContext>();
    if (!req.authContext?.userId) return false;
    return true;
  }
}
