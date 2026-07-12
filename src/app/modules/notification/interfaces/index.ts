export interface ISmsOption {
  recipient: string;
  message: string;
}

export interface IEmailAttachment {
  filename?: string;
  path?: string;
  content?: string;
}

export interface IEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: IEmailAttachment[];
}

export interface IPushNotificationResponse {
  success: boolean;
  message: string;
  successCount: number;
  failureCount: number;
  totalAttempts: number;
}

export interface ISendEmailResponse {
  success: boolean;
  message: string;
  data: any;
}

export interface ISendSmsResponse {
  success: boolean;
  message: string;
  data: any;
}
