export interface ICacheService {
  /**
   * Set a key-value pair in cache with optional TTL
   * @param key - The cache key
   * @param value - The value to cache (will be JSON stringified)
   * @param ttl - Time to live in seconds (default: 300)
   */
  setKey(key: string, value: any, ttl?: number): Promise<void>;

  /**
   * Get a value from cache by key
   * @param key - The cache key
   * @returns The cached value or null if not found
   */
  getKey(key: string): Promise<any>;

  /**
   * Delete keys matching a pattern
   * @param pattern - The pattern to match (e.g., 'user:*')
   */
  delKey(pattern: string): Promise<void>;

  /**
   * Delete keys using SCAN command for better performance
   * @param pattern - The pattern to match (e.g., '*user*')
   */
  deleteKeyPattern(pattern: string): Promise<void>;

  /**
   * Flush all cache data
   */
  flushAll(): Promise<void>;
}
