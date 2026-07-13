import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import { AppModule } from './app/app.module';
import { ENV } from './env';
import { createLogger } from './logger';
import { setupSecurity } from './security';
import { setupSwagger } from './swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: !ENV.isDevelopment ? createLogger() : ['error', 'warn', 'debug', 'log', 'verbose'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  useContainer(app.select(AppModule), {
    fallbackOnErrors: true,
  });

  app.setGlobalPrefix(ENV.api.API_PREFIX);

  setupSecurity(app);
  setupSwagger(app);

  await app.listen(ENV.port);

  console.warn(
    `\n\nAPI ===>>\n\nNODE_VERSION: v22.12.0\nNODE_ENV: ${ENV.env}\nRUNNING_ON: ${await app.getUrl()}\nAPI_DOCUMENTATION: ${await app.getUrl()}/docs\n\n`,
  );
}
bootstrap();
