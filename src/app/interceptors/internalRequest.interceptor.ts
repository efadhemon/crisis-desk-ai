import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class InternalRequestInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}
  intercept(_context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    // const request = context.switchToHttp().getRequest();

    // const panelKey = request?.panelKey ?? undefined;
    // if (panelKey !== 'core') throw new UnauthorizedException('Invalid panel key!');
    // const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
    // if (isPublic) return next.handle(); // 🚀 Skip auth for public routes

    // if (ENV.auth.skipAuth) return next.handle();
    // // Validate if verifiedUser exists
    // if (!request.verifiedUser) {
    //   throw new UnauthorizedException(
    //     'Unauthorized access: All internal request requires verified user.',
    //   );
    // }

    // // Validate if verifiedUser has roles and one of them is 'internal'
    // const roles = request.verifiedUser.roles || [];
    // if (!roles.includes(ENUM_ACL_DEFAULT_ROLES.INTERNAL)) {
    //   throw new UnauthorizedException(
    //     'Unauthorized access: Your role does not have the necessary clearance to make this request!.',
    //   );
    // }
    return next.handle();
  }
}
