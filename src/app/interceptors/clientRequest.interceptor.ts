import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ClientRequestInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.method === 'GET') {
      const query: any = request.query;
      query.isActive = true;

      if (query?.limit) {
        if (+query.limit > 100) {
          throw new BadRequestException('Requested limit is too high.');
        }
        if (+query.limit < 1) {
          query.limit = 1;
        }
      }

      Object.defineProperty(request, 'query', {
        value: query,
        writable: false,
        configurable: true,
        enumerable: true,
      });
    }

    return next.handle();
  }
}
