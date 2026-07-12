import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalConfigInternalController } from './controllers/internal/globalConfig.internal.controller';
import { GlobalConfig } from './entities/globalConfig.entity';
import { GlobalConfigService } from './services/globalConfig.service';

const entities = [GlobalConfig];

const services = [GlobalConfigService];
const subscribers = [];

const internalControllers = [GlobalConfigInternalController];

@Global()
@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  providers: [...services, ...subscribers],
  exports: [...services, ...subscribers],
  controllers: [...internalControllers],
})
export class GlobalConfigModule {}
