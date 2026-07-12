import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cache } from './entities/cache.entity';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { ValkeyCacheService } from './services/valkeyCache.service';

const entities = [Cache];

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([...entities])],
  providers: [ValkeyCacheService, CacheInterceptor],
  exports: [ValkeyCacheService, CacheInterceptor],
})
export class CacheModule {}
