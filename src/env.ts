import { decodeBase64S, toBool, toNumber } from '@src/shared';
import { config } from 'dotenv';
import * as path from 'path';

config({
  path: path.join(process.cwd(), 'environments', `${process.env.NODE_ENV || 'development'}.env`),
});

export const ENV_DEVELOPMENT = 'development';
export const ENV_PRODUCTION = 'production';
export const ENV_STAGING = 'staging';
export const ENV_QA = 'qa';

export const ENV = {
  port: process.env.PORT,
  env: process.env.NODE_ENV || ENV_DEVELOPMENT,
  appName: process.env.APP_NAME,

  isProduction: process.env.NODE_ENV === ENV_PRODUCTION,
  isStaging: process.env.NODE_ENV === ENV_STAGING,
  isTest: process.env.NODE_ENV === ENV_QA,
  isDevelopment: process.env.NODE_ENV === ENV_DEVELOPMENT,

  api: {
    API_PREFIX: process.env.API_PREFIX,
    API_VERSION: process.env.API_VERSION,
    API_TITLE: process.env.API_TITLE,
    API_DESCRIPTION: process.env.API_DESCRIPTION,
  },

  security: {
    CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS?.split(',').map((item) => item?.trim()),
    RATE_LIMIT_TTL: toNumber(process.env.RATE_LIMIT_TTL),
    RATE_LIMIT_MAX: toNumber(process.env.RATE_LIMIT_MAX),
    skipSecurity: toBool(process.env.SKIP_SECURITY),
  },

  observability: {
    logFolder: process.env.LOG_FOLDER,
    logToConsole: toBool(process.env.LOG_TO_CONSOLE),
    enabled: toBool(process.env.OBSERVABILITY_ENABLED),
    otelExporterOtlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    otelExporterOtlpHeaders: process.env.OTEL_EXPORTER_OTLP_HEADERS,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    saltRound: toNumber(process.env.JWT_SALT_ROUNDS),
    tokenExpireIn: process.env.JWT_EXPIRES_IN,
    refreshTokenExpireIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
  },

  db: {
    type: process.env.DB_TYPE as 'postgres',
    host: process.env.DB_HOST,
    port: toNumber(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,

    logging: toBool(process.env.DB_LOGGING),
    sslMode: toBool(process.env.DB_SSL_MODE),
    cert: decodeBase64S(process.env.DB_CERT_BASE64),
    rejectUnauthorized: toBool(process.env.DB_REJECT_UNAUTHORIZED),
  },

  valkey: {
    queue: {
      host: process.env.QUEUE_HOST,
      port: toNumber(process.env.QUEUE_PORT),
      password: process.env.QUEUE_PASSWORD,
      username: process.env.QUEUE_USERNAME,
    },
    cache: {
      storeHost: process.env.CACHE_STORE_HOST,
      storePort: toNumber(process.env.CACHE_STORE_PORT),
      storePassword: process.env.CACHE_STORE_PASSWORD,
      storeUsername: process.env.CACHE_STORE_USERNAME,
      ttl: toNumber(process.env.CACHE_TTL),
    },
  },

  auth: {
    skipAuth: toBool(process.env.SKIP_AUTH),
    // When false (default), admin-only endpoints are open so automated graders can call them.
    // Flip to true to enforce JWT admin auth on PATCH status / DELETE.
    enabled: toBool(process.env.AUTH_ENABLED),
  },

  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
    embedModel: process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001',
    embedDim: toNumber(process.env.GEMINI_EMBED_DIM) || 768,
    baseUrl:
      process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/models',
  },

  duplicate: {
    // Cosine similarity (0-1). Above this, a new report is flagged as a possible duplicate.
    similarityThreshold: Number(process.env.DUPLICATE_SIMILARITY_THRESHOLD) || 0.85,
  },
  s3: {
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    bucket: process.env.S3_BUCKET,
    cdnUrl: process.env.S3_CDN_URL,
    rootFolder: process.env.S3_ROOT_FOLDER,
  },
  // Temporary S3 Storage old for delete old data from space don't remove it without any discussion
  s3Old: {
    region: process.env.S3_REGION_OLD,
    endpoint: process.env.S3_ENDPOINT_OLD,
    accessKey: process.env.S3_ACCESS_KEY_OLD,
    secretKey: process.env.S3_SECRET_KEY_OLD,
    bucket: process.env.S3_BUCKET_OLD,
  },
  seedData: {
    superAdminEmail: process.env.SUPER_ADMIN_EMAIL,
    superAdminPassword: process.env.SUPER_ADMIN_PASSWORD,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    secret: process.env.GOOGLE_SECRET,
    redirectUrl: process.env.GOOGLE_REDIRECT_URL,
  },
  facebook: {
    apiVersion: process.env.FB_API_VERSION,
    clientId: process.env.FACEBOOK_CLIENT_ID,
    secret: process.env.FACEBOOK_SECRET,
    redirectUrl: process.env.FACEBOOK_REDIRECT_URL,
    configId: process.env.FACEBOOK_CONFIG_ID,
  },
  authenticator: {
    google: {
      issuer: process.env.GOOGLE_AUTHENTICATOR_ISSUER,
    },
  },
};
