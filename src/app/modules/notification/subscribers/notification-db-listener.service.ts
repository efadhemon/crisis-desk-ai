import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EmailNotificationQueue } from '@src/app/modules/@queue/queues/email-notification.queue';
import { SmsNotificationQueue } from '@src/app/modules/@queue/queues/sms-notification.queue';
import { ENV } from '@src/env';
import { Client, Notification } from 'pg';

@Injectable()
export class NotificationDbListenerService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly emailNotificationQueue: EmailNotificationQueue,
    private readonly smsNotificationQueue: SmsNotificationQueue,
  ) {}

  private readonly logger = new Logger(NotificationDbListenerService.name);
  private client: Client;

  // Serialized notification processing to prevent concurrent client.query() calls
  private isProcessing = false;
  private pendingNotifications: Notification[] = [];

  async onModuleInit(): Promise<void> {
    this.client = new Client({
      host: ENV.db.host,
      port: ENV.db.port,
      user: ENV.db.username,
      password: ENV.db.password,
      database: ENV.db.database,
      ssl: ENV.db.sslMode
        ? {
            ca: ENV.db.cert,
            rejectUnauthorized: ENV.db.rejectUnauthorized,
          }
        : false,
    });

    await this.client.connect();

    // Queue notifications and process them serially to avoid the pg@9 deprecation
    // "Calling client.query() when the client is already executing a query"
    this.client.on('notification', (msg: Notification) => {
      this.pendingNotifications.push(msg);
      this.drainQueue();
    });

    await this.client.query(`LISTEN email_notification_inserted`);
    await this.client.query(`LISTEN sms_notification_inserted`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.query(`UNLISTEN email_notification_inserted`);
      await this.client.query(`UNLISTEN sms_notification_inserted`);
      this.client.removeAllListeners('notification');
      await this.client.end();
    }
  }

  private async drainQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.pendingNotifications.length > 0) {
        const msg = this.pendingNotifications.shift();
        await this.handleNotification(msg);
      }
    } catch (error) {
      this.logger.error('Error processing DB notification:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async handleNotification(msg: Notification): Promise<void> {
    this.logger.debug(`DB notification received: ${msg.channel}`);

    if (msg.channel === 'email_notification_inserted') {
      const emailNotificationId = msg.payload;
      await this.emailNotificationQueue.sendEmailNotification(emailNotificationId);
    }

    if (msg.channel === 'sms_notification_inserted') {
      const smsNotificationId = msg.payload;
      await this.smsNotificationQueue.sendSmsNotification(smsNotificationId);
    }
  }
}
