import { Injectable, Logger, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ENV } from '@src/env';
import { NextFunction, Request } from 'express';
import { DataSource } from 'typeorm';
import { ApiKey } from '../modules/acl/entities/apiKey.entity';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource) {}

  private readonly logger = new Logger(ApiKeyMiddleware.name);
  private readonly apiKeyIgnoredDomains = [];

  async use(req: Request, _, next: NextFunction): Promise<void> {
    const origin = req.headers.origin || req.headers.host;

    // Validated X-Panel-Key
    // const AUTHORIZED_PANELS = ['core', 'provider', 'user', 'employer'];
    const panelRoute = req.originalUrl?.split('/')[3];
    const routePanelMap = {
      internal: 'core',
      provider: 'provider',
      employer: 'employer',
      app: 'user',
    };

    const panelKeyHeaders = req.headers['x-panel-key'];
    const panelKey: string = Array.isArray(panelKeyHeaders) ? panelKeyHeaders[0] : panelKeyHeaders;

    if (!panelKey) {
      throw new UnauthorizedException('X-Panel-Key is missing');
    }
    if (panelKey !== routePanelMap[panelRoute]) {
      throw new UnauthorizedException('Invalid X-Panel-Key');
    }

    req['panelKey'] = panelKey; // Attach panelKey info to request for guards/interceptors
    // end of X-Panel-Key validation

    // Validate X-Api-Key
    if (!ENV.isProduction) {
      this.logger.warn(`IGNORING API KEY CHECK FOR ==> ENVIRONMENT ==> ${ENV.env}`);
      return next();
    }

    if (origin && this.apiKeyIgnoredDomains.some((domain) => origin.includes(domain))) {
      // Skip middleware for these domains
      this.logger.warn('IGNORING API KEY CHECK FOR ==> ', origin);
      return next();
    }

    const apiKeyHeaders = req.headers['x-api-key'];
    const xApiKey: string = Array.isArray(apiKeyHeaders) ? apiKeyHeaders[0] : apiKeyHeaders;

    if (!xApiKey) {
      throw new UnauthorizedException('API Key is missing');
    }

    const apiKey = await this.dataSource.manager.findOne(ApiKey, {
      where: { key: xApiKey, isActive: true },
    });

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API Key');
    }

    req['apiKey'] = apiKey; // Attach apiKey info to request for guards/interceptors
    // end of X-Api-Key validation

    next();
  }
}
