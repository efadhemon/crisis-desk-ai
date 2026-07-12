import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PROCESS_EMAIL_NOTIFICATION } from '../constants/job.constant';
import { EMAIL_NOTIFICATION_QUEUE } from '../constants/queue.constant';

@Injectable()
export class EmailNotificationQueue {
  constructor(@InjectQueue(EMAIL_NOTIFICATION_QUEUE) private queue: Queue) {}

  async sendEmailNotification(emailNotificationId: string): Promise<void> {
    await this.queue.add(PROCESS_EMAIL_NOTIFICATION, emailNotificationId, {
      attempts: 3,
      backoff: 5000,
    });
  }
}
