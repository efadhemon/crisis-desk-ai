import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailNotificationService } from '../../notification/services/emailNotification.service';
import { PROCESS_EMAIL_NOTIFICATION } from '../constants/job.constant';
import { EMAIL_NOTIFICATION_QUEUE } from '../constants/queue.constant';

@Processor(EMAIL_NOTIFICATION_QUEUE)
export class EmailNotificationProcessor extends WorkerHost {
  constructor(private readonly emailNotificationService: EmailNotificationService) {
    super();
  }

  async process(job: Job<string>): Promise<any> {
    if (job.name === PROCESS_EMAIL_NOTIFICATION) {
      const emailNotificationId = job.data;
      await this.emailNotificationService.fireNotification(emailNotificationId);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    console.warn(`Processing ${job.name} job with id ${job.id}`);
  }
}
