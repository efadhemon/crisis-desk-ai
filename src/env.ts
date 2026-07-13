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
  seedData: {
    superAdminEmail: process.env.SUPER_ADMIN_EMAIL,
    superAdminPassword: process.env.SUPER_ADMIN_PASSWORD,
  },
};
