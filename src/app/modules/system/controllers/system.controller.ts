import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { minutes, Throttle } from '@nestjs/throttler';
import { Public } from '@src/app/decorators/publicRoute.decorator';
import { SkipKeyCheck } from '@src/app/decorators/skipKeyCheck.decorator';
import { SuccessResponse } from '@src/app/types';
import { SystemService } from '../services/system.service';

@ApiTags('System')
@Controller('system')
export class SystemController {
  constructor(private readonly service: SystemService) {}

  @Public()
  @SkipKeyCheck()
  @Get('/health')
  @HealthCheck()
  async check(): Promise<SuccessResponse<HealthCheckResult>> {
    return this.service.checkHealth();
  }

  @Public()
  @SkipKeyCheck()
  @Get('/version')
  async getVersion(): Promise<Record<string, any>> {
    return this.service.getVersion();
  }

  @Public()
  @SkipKeyCheck()
  @Throttle({ default: { ttl: minutes(1), limit: 3 } })
  @Get('rate-limited-check')
  async handleLimit(): Promise<Record<string, any>> {
    return this.service.handleLimit();
  }
}
