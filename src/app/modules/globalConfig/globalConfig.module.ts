import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalConfigController } from './controllers/globalConfig.controller';
import { GlobalConfig } from './entities/globalConfig.entity';
import { GlobalConfigService } from './services/globalConfig.service';

const entities = [GlobalConfig];

const services = [GlobalConfigService];
const subscribers = [];

const controllers = [GlobalConfigController];

@Global()
@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  providers: [...services, ...subscribers],
  exports: [...services, ...subscribers],
  controllers: [...controllers],
})
export class GlobalConfigModule {}
