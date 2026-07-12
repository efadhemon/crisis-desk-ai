import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { MAX_QUERY_LIMIT } from '../decorators/maxQueryLimit.decorator';
import { SKIP_LIMIT_CHECK } from '../decorators/skipLimitCheck.decorator';

@Injectable()
export class AppRequestInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.method === 'GET') {
      const query: any = {};
      Object.assign(query, request.query);

      let maxQueryLimit = this.reflector.get<number>(MAX_QUERY_LIMIT, context.getHandler());
      maxQueryLimit = maxQueryLimit ?? 100; // default limit if not set

      let skipLimitCheck = this.reflector.get<boolean>(SKIP_LIMIT_CHECK, context.getHandler());
      skipLimitCheck = skipLimitCheck ?? false; // default is false if not set

      if (query?.limit) {
        if (+query.limit > maxQueryLimit && !skipLimitCheck) {
          throw new BadRequestException('Requested limit is too high.');
        }
        if (+query.limit < 1) {
          query.limit = 1;
        }
      }
      query.isActive = true;

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
