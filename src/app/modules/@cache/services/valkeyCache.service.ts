import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ENV } from '@src/env';
import Valkey from 'iovalkey';
import { ICacheService } from '../interfaces/cache.interface';

@Injectable()
export class ValkeyCacheService implements ICacheService, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ValkeyCacheService.name);
  private valkeyClient: Valkey;

  onModuleInit(): void {
    try {
      this.valkeyClient = new Valkey({
        host: ENV.valkey.cache.storeHost,
        port: ENV.valkey.cache.storePort,
        password: ENV.valkey.cache.storePassword,
        username: ENV.valkey.cache.storeUsername,
        maxRetriesPerRequest: 1,
        lazyConnect: false,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.error('Valkey connection failed after 3 retries');
            return null;
          }
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.valkeyClient.on('connect', () => {
        this.logger.log('Valkey connected to save cache');
      });

      this.valkeyClient.on('ready', () => {
        this.logger.log('Valkey is ready to accept commands');
      });

      this.valkeyClient.on('error', (err) => {
        this.logger.error(`Valkey connection error: ${err.message}`);
      });

      this.valkeyClient.on('close', () => {
        this.logger.warn('Valkey connection closed');
      });
    } catch (error) {
      this.logger.error(`Failed to initialize Valkey client: ${error.message}`);
    }
  }

  onModuleDestroy(): void {
    if (this.valkeyClient) {
      this.logger.log('Disconnecting Valkey client');
      this.valkeyClient.disconnect();
    }
  }

  async setKey(key: string, value: any, ttl: number = 300): Promise<void> {
    if (!this.valkeyClient || this.valkeyClient.status !== 'ready') {
      this.logger.warn('Valkey client not ready, skipping cache set');
      return;
    }

    try {
      await this.valkeyClient.set(key, JSON.stringify(value), 'EX', ttl);
      this.logger.debug(`Cache set for key: ${key} with TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error(`Error setting key ${key}: ${error.message}`);
    }
  }

  async getKey(key: string): Promise<any> {
    if (!this.valkeyClient || this.valkeyClient.status !== 'ready') {
      this.logger.warn('Valkey client not ready, skipping cache get');
      return null;
    }

    try {
      const data = await this.valkeyClient.get(key);
      if (data) {
        this.logger.debug(`Cache hit for key: ${key}`);
        return JSON.parse(data);
      }
      this.logger.debug(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Error getting key ${key}: ${error.message}`);
      return null;
    }
  }

  async delKey(pattern: string): Promise<void> {
    if (!this.valkeyClient || this.valkeyClient.status !== 'ready') {
      this.logger.warn('Valkey client not ready, skipping cache delete');
      return;
    }

    try {
      const keys = await this.valkeyClient.keys(pattern);
      if (keys.length > 0) {
        await this.valkeyClient.del(...keys);
        this.logger.log(`Deleted ${keys.length} key(s) matching pattern: ${pattern}`);
      } else {
        this.logger.debug(`No keys found matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting keys matching ${pattern}: ${error.message}`);
    }
  }

  async deleteKeyPattern(pattern: string): Promise<void> {
    if (!this.valkeyClient || this.valkeyClient.status !== 'ready') {
      this.logger.warn('Valkey client not ready, skipping cache delete pattern');
      return;
    }

    try {
      const stream = this.valkeyClient.scanStream({
        match: pattern,
        count: 100,
      });

      let deletedCount = 0;

      stream.on('data', async (keys: string[]) => {
        if (keys.length) {
          const pipeline = this.valkeyClient.pipeline();
          keys.forEach((key) => {
            pipeline.del(key);
            deletedCount++;
          });
          try {
            await pipeline.exec();
          } catch (err) {
            this.logger.error(`Error deleting keys in pipeline: ${err.message}`);
          }
        }
      });

      return new Promise<void>((resolve, reject) => {
        stream.on('end', () => {
          this.logger.log(`Deleted ${deletedCount} key(s) matching pattern: ${pattern}`);
          resolve();
        });
        stream.on('error', (err) => {
          this.logger.error(`Error scanning keys with pattern ${pattern}: ${err.message}`);
          reject(err);
        });
      });
    } catch (error) {
      this.logger.error(`Error in deleteKeyPattern for ${pattern}: ${error.message}`);
      throw error;
    }
  }

  async flushAll(): Promise<void> {
    if (!this.valkeyClient || this.valkeyClient.status !== 'ready') {
      this.logger.warn('Valkey client not ready, skipping flush');
      return;
    }

    try {
      await this.valkeyClient.flushdb();
      this.logger.log('Flushed all cache data');
    } catch (error) {
      this.logger.error(`Error flushing cache: ${error.message}`);
    }
  }

  /**
   * Native Valkey client when connected — for hashes/sets etc. that are not JSON cache keys.
   * Returns null if the client is not ready (same guard as getKey/setKey).
   */
  getClient(): Valkey | null {
    if (!this.valkeyClient || this.valkeyClient.status !== 'ready') {
      return null;
    }
    return this.valkeyClient;
  }
}
