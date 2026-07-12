// global-request.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class GlobalRequestInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const validatedBody = request.body;

    if (validatedBody && typeof validatedBody === 'object' && request.verifiedUser) {
      const method = request.method;

      if (method === 'POST') {
        validatedBody.createdBy = request.verifiedUser.id || request.verifiedUser;
      } else if (method === 'PUT' || method === 'PATCH') {
        validatedBody.updatedBy = request.verifiedUser.id || request.verifiedUser;
      } else if (method === 'DELETE') {
        validatedBody.deletedBy = request.verifiedUser.id || request.verifiedUser;
      }

      // Replace the request.body with the enriched version
      request.body = validatedBody;
    }

    return next.handle();
  }
}
