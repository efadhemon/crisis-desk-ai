import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SmsNotificationService } from '../../notification/services/smsNotification.service';
import { PROCESS_SMS_NOTIFICATION } from '../constants/job.constant';
import { SMS_NOTIFICATION_QUEUE } from '../constants/queue.constant';

@Processor(SMS_NOTIFICATION_QUEUE)
export class SmsNotificationProcessor extends WorkerHost {
  constructor(private readonly smsNotificationService: SmsNotificationService) {
    super();
  }

  async process(job: Job<string>): Promise<any> {
    if (job.name === PROCESS_SMS_NOTIFICATION) {
      const smsNotificationId = job.data;
      await this.smsNotificationService.fireNotification(smsNotificationId);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    console.warn(`Processing ${job.name} job with id ${job.id}`);
  }
}
