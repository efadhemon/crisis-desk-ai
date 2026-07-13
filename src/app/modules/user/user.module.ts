import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelpersModule } from '@src/app/helpers/helpers.module';
import { UserController } from './controllers/user.controller';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { UserSubscriber } from './subscribers/user.subscriber';

const entities = [User];

const services = [UserService];
const subscribers = [UserSubscriber];

const controllers = [UserController];

const modules = [HelpersModule];

@Module({
  imports: [TypeOrmModule.forFeature(entities), ...modules],
  providers: [...services, ...subscribers],
  exports: [...services, ...subscribers],
  controllers: [...controllers],
})
export class UserModule {}
