import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getClass(),
      context.getHandler(),
    ]);

    if (!permissions.length) {
      return true;
    }
    const request = context.switchToHttp().getRequest();

    const userPermissions = request.user?.permissions || [];

    return userPermissions.some((uPermission) => permissions.includes(uPermission));
  }
}
