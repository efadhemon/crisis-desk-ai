import { Injectable } from '@nestjs/common';
import { HealthCheckResult, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { SuccessResponse } from '@src/app/types';
import { ENV } from '@src/env';

@Injectable()
export class SystemService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  async checkHealth(): Promise<SuccessResponse<HealthCheckResult>> {
    const healthResult = await this.health.check([() => this.db.pingCheck('database')]);
    return new SuccessResponse('Health check successful', healthResult);
  }

  getVersion(): Record<string, any> {
    return {
      success: true,
      statusCode: 200,
      message: 'WAGE HATE API is working',
      data: ENV.api.API_VERSION,
    };
  }

  handleLimit(): Record<string, any> {
    return {
      success: true,
      statusCode: 200,
      message: 'Rate limit check passed',
      data: 'You can access this endpoint',
    };
  }
}
