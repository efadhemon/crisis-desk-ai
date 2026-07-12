import { LoggerService } from '@nestjs/common';
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';
import { utilities, WinstonModule, WinstonModuleOptions } from 'nest-winston';
import { format, transports } from 'winston';
import 'winston-daily-rotate-file';
import { ENV } from './env';

export function createLogger(): LoggerService {
  // JSON format for file logs
  const jsonFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json(),
  );

  // Console format for development (human-readable)
  const consoleFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    utilities.format.nestLike('WageAPI', {
      // Added an app name prefix for readability
      colors: true,
      prettyPrint: true,
    }),
  );

  const winstonTransports: WinstonModuleOptions['transports'] = [
    // Error logs - daily rotation
    new transports.DailyRotateFile({
      filename: `${ENV.observability.logFolder}/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: jsonFormat,
      maxSize: '20m',
      maxFiles: '14d', // Keep 14 days
      zippedArchive: true,
    }),

    // Combined logs - daily rotation
    new transports.DailyRotateFile({
      filename: `${ENV.observability.logFolder}/app-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      format: jsonFormat,
      maxSize: '20m',
      maxFiles: '7d', // Keep 7 days
      zippedArchive: true,
    }),
  ];

  // Dev: pretty console. Prod/staging: optional JSON console for `docker logs` (LOG_TO_CONSOLE=true).
  const enableConsole = ENV.isDevelopment || ENV.observability.logToConsole;
  if (enableConsole) {
    winstonTransports.push(
      new transports.Console({
        format: ENV.isDevelopment ? consoleFormat : jsonFormat,
        level: ENV.isDevelopment ? 'debug' : 'info',
      }),
    );
  }

  // Route logs through OpenTelemetry (Sends to Grafana Cloud) if observability is enabled
  if (ENV.observability.enabled) {
    winstonTransports.push(
      new OpenTelemetryTransportV3({
        level: 'info', // QUOTA FIX: Never send debug/verbose logs to Grafana to save free tier limits
        format: format.combine(format.errors({ stack: true }), format.json()),
      }),
    );
  }

  const winstonOptions: WinstonModuleOptions = {
    transports: winstonTransports,
  };

  return WinstonModule.createLogger(winstonOptions);
}
