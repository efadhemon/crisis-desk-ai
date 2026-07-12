import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@src/app/decorators/publicRoute.decorator';
import { SKIP_KEY_CHECK } from '@src/app/decorators/skipKeyCheck.decorator';
import { JWTHelper } from '@src/app/helpers';
import { ENV } from '@src/env';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { ApiKey } from '../../acl/entities/apiKey.entity';
import { ENUM_USER_TYPES } from '../../user/enums';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtHelper: JWTHelper,
    private readonly dataSource: DataSource,
  ) {}

  private readonly logger = new Logger(AuthGuard.name);
  private readonly apiKeyIgnoredDomains = [];

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (ENV.auth.skipAuth) return true; // 🚀 Skip auth if disabled in env

    const request = context.switchToHttp().getRequest<Request>();

    const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
    if (!isPublic) {
      await this.validateAuth(request);
    }

    const skipKeyCheck = this.reflector.get<boolean>(SKIP_KEY_CHECK, context.getHandler());
    if (!skipKeyCheck) {
      await this.validateKeys(request);
    }

    return true;
  }

  private async validateAuth(request: Request): Promise<void> {
    const token = this.jwtHelper.extractToken(request.headers);

    const verifiedUser = this.jwtHelper.verify(token);
    if (!verifiedUser) {
      throw new UnauthorizedException('Unauthorized Access Detected');
    }

    const panelRoute = request.originalUrl?.split('/')[3];
    const routeUserTypeMap = {
      internal: ENUM_USER_TYPES.INTERNAL,
      app: ENUM_USER_TYPES.USER,
    };
    const expectedUserType = routeUserTypeMap[panelRoute];
    if (verifiedUser.user?.userType !== expectedUserType) {
      throw new UnauthorizedException('Unauthorized Access Detected: User type mismatch');
    }
    request['verifiedUser'] = verifiedUser.user;
  }

  private async validateKeys(request: Request): Promise<void> {
    // Validated X-Panel-Key
    const origin = request.headers.origin || request.headers.host;
    const panelRoute = request.originalUrl?.split('/')[3];
    const routePanelMap = {
      internal: 'core',
      provider: 'provider',
      employer: 'employer',
      app: 'user',
      web: 'web',
    };

    const panelKeyHeaders = request.headers['x-panel-key'];
    const panelKey: string = Array.isArray(panelKeyHeaders) ? panelKeyHeaders[0] : panelKeyHeaders;

    if (!panelKey) {
      throw new UnauthorizedException('X-Panel-Key is missing');
    }
    if (panelKey !== routePanelMap[panelRoute]) {
      throw new UnauthorizedException('Invalid X-Panel-Key');
    }

    request['panelKey'] = panelKey; // Attach panelKey info to request for guards/interceptors
    // end of X-Panel-Key validation

    // Validate X-Api-Key
    if (!ENV.isProduction) {
      this.logger.warn(`IGNORING API KEY CHECK FOR ==> ENVIRONMENT ==> ${ENV.env}`);
      return;
    }

    if (origin && this.apiKeyIgnoredDomains.some((domain) => origin.includes(domain))) {
      this.logger.warn('IGNORING API KEY CHECK FOR ==> ', origin);
      return;
    }

    const apiKeyHeaders = request.headers['x-api-key'];
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

    request['apiKey'] = apiKey;
    // end of X-Api-Key validation
  }
}
