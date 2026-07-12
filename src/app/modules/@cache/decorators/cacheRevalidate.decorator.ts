import { SetMetadata } from '@nestjs/common';

export const CACHE_REVALIDATE_KEYS = Symbol('CACHE_REVALIDATE_KEYS');

export const CacheRevalidateKeys = (...keys: string[]): MethodDecorator =>
  SetMetadata(CACHE_REVALIDATE_KEYS, keys);
