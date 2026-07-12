import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PROCESS_SMS_NOTIFICATION } from '../constants/job.constant';
import { SMS_NOTIFICATION_QUEUE } from '../constants/queue.constant';

@Injectable()
export class SmsNotificationQueue {
  constructor(@InjectQueue(SMS_NOTIFICATION_QUEUE) private queue: Queue) {}

  async sendSmsNotification(smsNotificationId: string): Promise<void> {
    await this.queue.add(PROCESS_SMS_NOTIFICATION, smsNotificationId, {
      attempts: 3,
      backoff: 5000,
    });
  }
}
