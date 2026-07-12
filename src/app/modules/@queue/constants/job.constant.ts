import { ENV } from '@src/env';

export const PROCESS_EMAIL_NOTIFICATION = `${ENV.appName}_${ENV.env}_process_email_notification`;
export const PROCESS_SMS_NOTIFICATION = `${ENV.appName}_${ENV.env}_process_sms_notification`;

export const jobProcessors = [PROCESS_EMAIL_NOTIFICATION, PROCESS_SMS_NOTIFICATION];
