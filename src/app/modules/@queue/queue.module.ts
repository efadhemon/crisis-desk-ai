import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ENV } from '@src/env';

import { NotificationModule } from '../notification/notification.module';
import { queueNames } from './constants/queue.constant';
import { EmailNotificationProcessor } from './jobs/email-notification.processor';
import { SmsNotificationProcessor } from './jobs/sms-notification.processor';
import { EmailNotificationQueue } from './queues/email-notification.queue';
import { SmsNotificationQueue } from './queues/sms-notification.queue';

const queues = [EmailNotificationQueue, SmsNotificationQueue];

const processors = [EmailNotificationProcessor, SmsNotificationProcessor];

@Global()
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: ENV.valkey.queue.host,
        port: ENV.valkey.queue.port,
        password: ENV.valkey.queue.password,
      },
    }),
    BullModule.registerQueue(...queueNames.map((name) => ({ name }))),
    NotificationModule,
  ],
  providers: [...queues, ...processors],
  exports: [...queues],
})
export class QueueModule {}
