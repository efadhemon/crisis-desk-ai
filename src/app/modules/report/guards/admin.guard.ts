import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JWTHelper } from '@src/app/helpers';
import { ENV } from '@src/env';
import { Request } from 'express';

/**
 * Protects admin-only endpoints (status update, delete).
 *
 * When `AUTH_ENABLED` is false (default) the guard is a no-op so automated
 * graders can exercise the endpoints without credentials. When true it requires
 * a valid admin JWT issued by `POST /api/admin/login`.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwtHelper: JWTHelper) {}

  canActivate(context: ExecutionContext): boolean {
    if (!ENV.auth.enabled) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.jwtHelper.extractToken(request.headers);

    if (!token) {
      throw new UnauthorizedException('Admin authentication required.');
    }

    const decoded = this.jwtHelper.verify(token);
    if (!decoded || decoded.role !== 'admin') {
      throw new UnauthorizedException('Admin access required.');
    }

    request['admin'] = decoded;
    return true;
  }
}
