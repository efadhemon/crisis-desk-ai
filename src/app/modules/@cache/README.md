# Cache Module

A comprehensive caching module for NestJS applications using Valkey as the cache store.

## Features

- ✅ Valkey-based caching with automatic connection management
- ✅ Decorator-based cache configuration
- ✅ Cache interceptor for automatic response caching
- ✅ Cache invalidation and revalidation
- ✅ TTL (Time To Live) configuration per endpoint
- ✅ Pattern-based cache deletion
- ✅ Comprehensive error handling and logging
- ✅ TypeScript interfaces for type safety

## Installation

The module is already integrated into your application. Make sure Valkey configuration is set in your environment variables.

## Configuration

Ensure your environment variables include:

```env
CACHE_STORE_HOST=localhost
CACHE_STORE_PORT=6379
CACHE_STORE_PASSWORD=efadhemon
CACHE_STORE_USERNAME=default
CACHE_TTL=60
```

## Usage

### 1. Basic Cache Usage

Use the `@CacheKey` decorator to enable caching for a controller method:

```typescript
import { CacheKey, CacheTTL, CacheInterceptor, ENUM_CACHE_TTL } from '@app/modules/@cache';

@Controller('users')
@UseInterceptors(CacheInterceptor)
export class UsersController {
  // GET requests are automatically cached
  @Get(':id')
  @CacheKey('user:{id}')
  @CacheTTL(ENUM_CACHE_TTL.TEN_MINUTES) // Cache for 10 minutes
  async getUser(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // POST/PUT/PATCH/DELETE automatically revalidate cache
  @Post()
  @CacheKey('user') // Used for auto-revalidation
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

### 2. Cache Invalidation

Use `@CacheRevalidateKeys` to explicitly specify which cache patterns to invalidate:

```typescript
@Patch(':id')
@CacheRevalidateKeys(['user', 'users:list']) // Invalidates *user* and *users:list*
async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  return this.usersService.update(id, updateUserDto);
}
```

**Note:** Mutation methods (POST, PUT, PATCH, DELETE) automatically revalidate cache based on `@CacheKey` if no `@CacheRevalidateKeys` is provided.

### 3. Manual Cache Operations

Inject `ValkeyCacheService` for manual cache operations:

```typescript
import { ValkeyCacheService } from '@app/modules/@cache';

@Injectable()
export class UsersService {
  constructor(private readonly cacheService: ValkeyCacheService) {}

  async invalidateUserCache(userId: string) {
    // Delete specific key
    await this.cacheService.delKey(`*user:${userId}*`);
  }

  async cacheUserData(userId: string, data: any) {
    // Manually set cache
    const key = `v1:user:${userId}`;
    await this.cacheService.setKey(key, data, 600);
  }

  async clearAllUserCache() {
    // Delete all user-related cache
    await this.cacheService.deleteKeyPattern('*user*');
  }
}
```

## Enums

### ENUM_CACHE_TTL

Predefined TTL values (in seconds) for common cache durations:

```typescript
import { ENUM_CACHE_TTL } from '@app/modules/@cache';

// Available values:
ENUM_CACHE_TTL.ONE_MINUTE; // 60
ENUM_CACHE_TTL.FIVE_MINUTES; // 300
ENUM_CACHE_TTL.TEN_MINUTES; // 600
ENUM_CACHE_TTL.THIRTY_MINUTES; // 1800
ENUM_CACHE_TTL.ONE_HOUR; // 3600
ENUM_CACHE_TTL.SIX_HOURS; // 21600
ENUM_CACHE_TTL.TWELVE_HOURS; // 43200
ENUM_CACHE_TTL.ONE_DAY; // 86400
```

## Decorators

### @CacheKey(key: string)

Defines the cache key prefix for the endpoint. Use `{param}` syntax to include route parameters.

### @CacheTTL(seconds: number)

Sets the Time To Live for cached responses in seconds. Default is from ENV.valkey.cache.ttl. Use `ENUM_CACHE_TTL` for predefined values.

### @CacheRevalidateKeys(keys: string[])

Invalidates all cache keys matching the provided patterns after the request completes.

## Service Methods

### ValkeyCacheService

#### `setKey(key: string, value: any, ttl?: number): Promise<void>`

Store a value in cache with optional TTL.

#### `getKey(key: string): Promise<any>`

Retrieve a value from cache.

#### `delKey(pattern: string): Promise<void>`

Delete keys matching a pattern using Valkey KEYS command.

#### `deleteKeyPattern(pattern: string): Promise<void>`

Delete keys matching a pattern using Valkey SCAN for better performance.

#### `flushAll(): Promise<void>`

Clear all cached data.

## Best Practices

1. **Always use CacheInterceptor**: Apply `@UseInterceptors(CacheInterceptor)` to controllers that need caching
2. **Use meaningful cache keys**: Use clear naming with proper namespacing (e.g., 'user:{id}', 'products:list')
3. **Set appropriate TTLs**: Balance between freshness and performance
4. **Mutations auto-revalidate**: POST/PUT/PATCH/DELETE automatically clear related cache based on `@CacheKey`
5. **Use `@CacheRevalidateKeys` for explicit control**: Override auto-revalidation when you need to clear specific patterns
6. **Use pattern matching carefully**: Wildcard patterns can be expensive on large datasets
7. **Monitor cache hit rates**: Check logs for cache hits/misses
8. **Handle cache failures gracefully**: The module continues working even if Valkey is unavailable

## Error Handling

The module includes comprehensive error handling:

- Automatic retry on connection failures (up to 3 times)
- Graceful degradation when Valkey is unavailable
- Detailed logging for debugging
- No breaking errors - cache failures won't crash your app

## Troubleshooting

### Cache not working

1. Verify Valkey connection settings
2. Check if `@UseInterceptors(CacheInterceptor)` is applied
3. Ensure `@CacheKey` decorator is present
4. Check logs for Valkey connection errors

### Cache not invalidating

1. Verify the pattern in `@CacheRevalidateKeys` matches your keys
2. Check if keys are properly namespaced
3. Review logs for deletion errors

## Performance Considerations

- Use `deleteKeyPattern` instead of `delKey` for large-scale deletions
- Set appropriate TTL values based on data volatility
- Monitor Valkey memory usage
- Consider using Valkey clustering for high-traffic applications
