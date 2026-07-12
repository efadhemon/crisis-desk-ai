import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ENV } from '@src/env';
import { Request } from 'express';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CACHE_KEY } from '../decorators/cacheKey.decorator';
import { CACHE_REVALIDATE_KEYS } from '../decorators/cacheRevalidate.decorator';
import { CACHE_TTL } from '../decorators/cacheTTL.decorator';
import { ValkeyCacheService } from '../services/valkeyCache.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(ValkeyCacheService) private readonly cacheService: ValkeyCacheService,
    private readonly reflector: Reflector,
  ) {}

  private readonly logger = new Logger(CacheInterceptor.name);

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const handler = context.getHandler();
    const request: Request = context.switchToHttp().getRequest();

    const method = request.method?.toUpperCase();

    // Mutation methods (POST, PUT, PATCH, DELETE) should revalidate cache
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (isMutation) {
      return next.handle().pipe(
        tap(async (responseBody) => {
          // Check for explicit revalidate keys from decorator
          const revalidateKeys = this.reflector.get<string[]>(CACHE_REVALIDATE_KEYS, handler);

          if (revalidateKeys?.length) {
            // Use explicit keys if provided
            const patterns = revalidateKeys.map((key) =>
              this.buildCachePattern(key, request, responseBody),
            );
            await this.revalidateCacheKeys(patterns);
          } else {
            // Auto-revalidate based on cache key if provided
            const cacheKeyPrefix = this.reflector.get<string>(CACHE_KEY, handler);
            if (cacheKeyPrefix) {
              const pattern = this.buildCachePattern(cacheKeyPrefix, request, responseBody);
              await this.revalidateCacheKeys([pattern]);
            }
          }
        }),
      );
    }

    // GET requests - serve from cache
    const cacheKeyPrefix = this.reflector.get<string>(CACHE_KEY, handler);
    if (!cacheKeyPrefix) {
      this.logger.debug(`Cache key not found for endpoint: ${request?.url}`);
      this.logger.debug(`So Skipping cache for endpoint: ${request.url}`);
      return next.handle();
    }

    const key = this.getCacheKey(cacheKeyPrefix, request);
    const ttl = this.reflector.get<number>(CACHE_TTL, handler) ?? ENV.valkey.cache.ttl;

    // Try to serve from cache
    try {
      const cached = await this.cacheService.getKey(key);
      if (cached !== null) {
        return of(cached);
      }
    } catch (err) {
      this.logger.error(`Valkey getKey failed for ${key}: ${err.message}`);
    }

    // Cache the response after execution
    return next.handle().pipe(
      tap(async (response) => {
        if (response !== null && response !== undefined) {
          try {
            await this.cacheService.setKey(key, response, ttl);
          } catch (err) {
            this.logger.error(`Valkey setKey failed for ${key}: ${err.message}`);
          }
        }
      }),
      catchError((err) => {
        this.logger.error(`Handler error for ${request?.url}: ${err.message}`);
        throw err;
      }),
    );
  }

  private async revalidateCacheKeys(keys: string[]): Promise<void> {
    const deletePromises = keys.map(async (key) => {
      try {
        await this.cacheService.deleteKeyPattern(`${key}*`);
      } catch (err) {
        this.logger.error(`Valkey deleteKeyPattern failed for ${key}*: ${err.message}`);
      }
    });

    await Promise.allSettled(deletePromises);
  }

  private getCacheKey(prefix: string, request: Request): string {
    const { method, url, query } = request;

    const pattern = this.buildCachePattern(prefix, request);
    const lang = request?.query?.language || request?.headers['x-language'] || 'en';
    let key = `${pattern}_${ENV.env}_${lang}`;

    key += `_${method}:${url}`;

    if (Object.keys(query).length) {
      key += `?${new URLSearchParams(query as Record<string, string>).toString()}`;
    }

    return key;
  }

  private buildCachePattern(prefix: string, request: Request, responseBody?: any): string {
    let pattern = prefix;

    // Replace route params (e.g., {id})
    if (request.params) {
      Object.entries(request.params).forEach(([k, v]) => {
        pattern = pattern.replace(`{${k}}`, String(v));
      });
    }

    if (responseBody) {
      // Replace response placeholders (e.g., {slug})
      Object.entries(responseBody).forEach(([k, v]) => {
        pattern = pattern.replace(`{${k}}`, String(v));
      });
    }

    // Replace user ID if present (e.g., {userId})
    if (request?.['verifiedUser']?.id) {
      pattern = pattern.replace('{userId}', String(request?.['verifiedUser'].id));
    }

    return pattern;
  }
}
