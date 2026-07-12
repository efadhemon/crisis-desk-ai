import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = Symbol('CACHE_KEY');

export const CacheKey = (key: string): MethodDecorator => SetMetadata(CACHE_KEY, key);
