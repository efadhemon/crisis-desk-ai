import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { minutes, Throttle } from '@nestjs/throttler';
import { Public } from '@src/app/decorators/publicRoute.decorator';
import { SuccessResponse } from '@src/app/types';
import { SystemService } from '../services/system.service';

@ApiTags('System')
@Controller('system')
export class SystemController {
  constructor(private readonly service: SystemService) {}

  @Public()
  @Get('/health')
  @HealthCheck()
  async check(): Promise<SuccessResponse<HealthCheckResult>> {
    return this.service.checkHealth();
  }

  @Public()
  @Get('/version')
  async getVersion(): Promise<Record<string, any>> {
    return this.service.getVersion();
  }

  @Public()
  @Throttle({ default: { ttl: minutes(1), limit: 3 } })
  @Get('rate-limited-check')
  async handleLimit(): Promise<Record<string, any>> {
    return this.service.handleLimit();
  }
}
