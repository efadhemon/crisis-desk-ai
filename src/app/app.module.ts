import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '@src/database/database.module';
import { ENV } from '@src/env';
import { ClsModule } from 'nestjs-cls';
import { ExceptionFilter } from './filters';
import { CustomThrottlerGuard } from './guards/throttler-custom.guard';
import { HelpersModule } from './helpers/helpers.module';
import { ResponseInterceptor } from './interceptors';
import { ClsUserInterceptor } from './interceptors/clsUser.interceptor';
import { RequestLoggerMiddleware } from './middlewares/requestLogger.middleware';
import { CacheModule } from './modules/@cache/cache.module';
import { EventModule } from './modules/@event/event.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './modules/auth/guards/local-auth.guard';
import { ReportModule } from './modules/report/report.module';
import { SystemModule } from './modules/system/system.module';
import { UserModule } from './modules/user/user.module';
import { UniqueValidatorPipe } from './pipes/uniqueValidator.pipe';

const MODULES = [
  DatabaseModule,
  ClsModule.forRoot({
    global: true,
    middleware: { mount: true },
  }),
  ScheduleModule.forRoot(),
  ThrottlerModule.forRoot({
    throttlers: [
      {
        // 👈 unnamed = default (global)
        ttl: ENV.security.RATE_LIMIT_TTL,
        limit: ENV.security.RATE_LIMIT_MAX,
      },
    ],
  }),
  SystemModule,
  HelpersModule,
  AuthModule,
  UserModule,
  CacheModule,
  EventModule,
  ReportModule,
];
const PIPES = [UniqueValidatorPipe];

@Module({
  imports: [...MODULES],
  controllers: [],
  providers: [
    ...PIPES,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: GlobalRequestInterceptor,
    // },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClsUserInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*'); // apply globally or specify routes
    // consumer
    //   .apply(ApiKeyMiddleware)
    //   .exclude({
    //     path: '/app/auth/delete-account-data',
    //     method: RequestMethod.ALL,
    //   })
    //   .forRoutes('*'); // apply globally or specify routes
  }
}
