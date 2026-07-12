import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL = Symbol('CACHE_TTL');

export const CacheTTL = (ttl: number): MethodDecorator => SetMetadata(CACHE_TTL, ttl);
