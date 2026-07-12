export enum ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE {
  DEFAULT = 'default',
  CUSTOM = 'custom',
}

export enum ENUM_SMS_GATEWAY_REQUEST_METHOD {
  GET = 'get',
  POST = 'post',
}

export enum ENUM_NOTIFICATION_CHANNEL {
  SMS = 'sms',
  EMAIL = 'email',
  IN_APP = 'in_app',
}

export enum ENUM_NOTIFICATION_TYPE {
  GENERAL = 'general',
  PROMOTIONAL = 'promotional',
  PROFILE_COMPLETION = 'profile_completion',
  PROFILE_VERIFIED = 'profile_verified',
  NEW_JOB_DEMAND = 'new_job_demand',
  NEW_OPPORTUNITY = 'new_opportunity',
  COURSE_ENROLLED = 'course_enrolled',
  APPLIED_TO_JOB = 'applied_to_job',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  STATUS_UPDATE = 'status_update',
  VIDEO_UPLOAD = 'video_upload',
  CALL_INIT = 'call_init',
  CALL_ACCEPTED = 'call_accepted',
  CALL_CANCELED = 'call_canceled',
  CALL_ENDED = 'call_ended',
  CALL_MISSED = 'call_missed',
  CALL_FAILED = 'call_failed',
  CHAT_MESSAGE = 'chat_message',
  INVOICE_PAYMENT = 'invoice_payment',
}

export enum ENUM_NOTIFICATION_CONTEXT_SOURCE {
  USER_REGISTRATION = 'user_registration',
  JOB_DEMAND = 'job_demand',
  JOB_APPLICATION = 'job_application',
}

export enum ENUM_NOTIFICATION_CONTEXT_ACTION {
  CREATE = 'create',
  UPDATE = 'update',
  ACCOUNT_CREATED = 'account_created',
}

export enum ENUM_NOTIFICATION_CONTEXT_PROFILE_TYPE {
  WORKER = 'worker',
  EMPLOYER = 'employer',
  PROVIDER = 'provider',
}

export enum ENUM_PUSH_NOTIFICATION_PLATFORM {
  ANDROID = 'android',
  IOS = 'ios',
  WEB = 'web',
}

export enum ENUM_CAMPAIGN_STATUS {
  DRAFT = 'draft',
  PREPARED = 'prepared',
  RUNNING = 'running',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export enum ENUM_CAMPAIGN_TARGET_AUDIENCE {
  ALL_USERS = 'all_users',
  ALL_EMPLOYERS = 'all_employers',
  ALL_PROVIDERS = 'all_providers',
  ALL_WORKERS = 'all_workers',

  SPECIFIC_USERS = 'specific_users',
  SPECIFIC_EMPLOYERS = 'specific_employers',
  SPECIFIC_PROVIDERS = 'specific_providers',
  SPECIFIC_WORKERS = 'specific_workers',

  BY_ROLES = 'by_roles',
  SELECTED_USERS = 'selected_users',
}

export enum ENUM_RECIPIENT_STATUS {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}
