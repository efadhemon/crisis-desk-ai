import { ENV } from '@src/env';

export const EMAIL_NOTIFICATION_QUEUE = `${ENV.appName}_${ENV.env}_email_notification_queue`;
export const SMS_NOTIFICATION_QUEUE = `${ENV.appName}_${ENV.env}_sms_notification_queue`;

export const queueNames = [EMAIL_NOTIFICATION_QUEUE, SMS_NOTIFICATION_QUEUE];
