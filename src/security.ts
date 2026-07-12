import { INestApplication, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { ENV } from './env';

export function setupSecurity(app: INestApplication): void {
  if (ENV.security.skipSecurity) return;

  const logger = new Logger('Security');
  const appHeader = app.getHttpAdapter().getInstance();

  // Trust proxy headers (for HTTPS + IPs)
  appHeader.set('trust proxy', 1);

  // Global security HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'trusted-domain.com'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
    }),
  );

  // Disable x-powered-by
  appHeader.disable('x-powered-by');

  // CORS Configuration
  const allowedOrigins = ENV.security.CORS_ALLOWED_ORIGINS;
  app.enableCors({
    origin: (origin: string, callback: (error: Error | null, allow?: boolean) => void) => {
      // if origin is not starting with http, it is not a valid origin
      if (!origin?.startsWith('http')) return callback(null, true);

      if (allowedOrigins.some((o) => origin.startsWith(o))) {
        callback(null, true);
      } else {
        callback(new Error(`Request origin ${origin} not allowed by CORS`));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Body parsing limits
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  logger.log('🔒 Security middlewares initialized 🚀');
}
