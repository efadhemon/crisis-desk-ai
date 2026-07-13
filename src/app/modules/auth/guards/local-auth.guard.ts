import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@src/app/decorators/publicRoute.decorator';
import { JWTHelper } from '@src/app/helpers';
import { ENV } from '@src/env';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtHelper: JWTHelper,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (ENV.auth.skipAuth) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    await this.validateAuth(request);
    return true;
  }

  private async validateAuth(request: Request): Promise<void> {
    const token = this.jwtHelper.extractToken(request.headers);
    if (!token) {
      throw new UnauthorizedException('Unauthorized Access Detected');
    }

    const verifiedUser = this.jwtHelper.verify(token);
    if (!verifiedUser?.user?.id) {
      throw new UnauthorizedException('Unauthorized Access Detected');
    }

    request['verifiedUser'] = verifiedUser.user;
  }
}
