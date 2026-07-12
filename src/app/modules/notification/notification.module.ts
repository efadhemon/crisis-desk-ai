import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { EmailGatewayController } from './controllers/emailGateway.controller';
import { SmsGatewayController } from './controllers/smsGateway.controller';
import { EmailGateway } from './entities/emailGateway.entity';
import { EmailNotification } from './entities/emailNotification.entity';
import { SmsGateway } from './entities/smsGateway.entity';
import { SmsNotification } from './entities/smsNotification.entity';
import { EmailGatewayService } from './services/emailGateway.service';
import { EmailNotificationService } from './services/emailNotification.service';
import { SmsGatewayService } from './services/smsGateway.service';
import { SmsNotificationService } from './services/smsNotification.service';
import { NotificationDbListenerService } from './subscribers/notification-db-listener.service';

const entities = [EmailGateway, SmsGateway, EmailNotification, SmsNotification];
const services = [
  EmailGatewayService,
  SmsGatewayService,
  EmailNotificationService,
  SmsNotificationService,
];

const subscribers = [NotificationDbListenerService];

const controllers = [EmailGatewayController, SmsGatewayController];

const modules = [HttpModule, UserModule];

@Global()
@Module({
  imports: [TypeOrmModule.forFeature(entities), ...modules],
  providers: [...services, ...subscribers],
  exports: [...services, ...subscribers],
  controllers: [...controllers],
})
export class NotificationModule {}
