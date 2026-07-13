import { LoggerService } from '@nestjs/common';
import { utilities, WinstonModule, WinstonModuleOptions } from 'nest-winston';
import { format, transports } from 'winston';
import 'winston-daily-rotate-file';
import { ENV } from './env';

const LOG_FOLDER = 'logs';

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
    utilities.format.nestLike('CrisisDesk AI API', {
      colors: true,
      prettyPrint: true,
    }),
  );

  const winstonTransports: WinstonModuleOptions['transports'] = [
    new transports.DailyRotateFile({
      filename: `${LOG_FOLDER}/error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: jsonFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    new transports.DailyRotateFile({
      filename: `${LOG_FOLDER}/app-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      format: jsonFormat,
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
    }),
    new transports.Console({
      format: ENV.isDevelopment ? consoleFormat : jsonFormat,
      level: ENV.isDevelopment ? 'debug' : 'info',
    }),
  ];

  return WinstonModule.createLogger({
    transports: winstonTransports,
  });
}
