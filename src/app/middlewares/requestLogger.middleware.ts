import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as requestIp from 'request-ip';

interface IRequestLog {
  // request info
  method: string;
  url: string;
  query: any;
  body: any;

  // user info
  ip: string;
  // location: string;
  userAgent: string;

  // performance info
  statusCode: number;
  responseTime: string;
}

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);
  // private readonly ipCache = new NodeCache();
  // private readonly DEFAULT_TTL = 1000 * 60 * 60 * 1; // 1 hour
  // private readonly AUTHORIZED_IPS_MAP = {
  //   '202.4.127.134': 'WH OFFICE, Dhaka, BD',
  // };

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    let ip = requestIp.getClientIp(req);

    const requestLog: IRequestLog = {
      method: req.method,
      url: req.originalUrl,
      query: this.sanitizeQuery(req.query),
      body: this.sanitizePayload(req.body),
      ip: ip || 'unknown',
      // location: 'Unknown',
      userAgent: req.get('user-agent'),
      statusCode: 0,
      responseTime: '0ms',
    };

    // localhost or local network
    if (ip === '::1' || ip === '127.0.0.1' || !ip) {
      // requestLog.location = 'Localhost';
      res.on('finish', () => {
        requestLog.statusCode = res.statusCode;
        requestLog.responseTime = `${Date.now() - startTime}ms`;
        this.logger.log(requestLog);
      });
      return next();
    }

    ip = ip.replace(/^.*:/, ''); // clean IPv6 mapped IPv4

    req['userIp'] = ip; // attach to req object if needed downstream

    // let location = this.ipCache.get<string>(ip);

    // if (!location) {
    //   const authorizedLocation = this.AUTHORIZED_IPS_MAP[ip];
    //   if (authorizedLocation) {
    //     location = authorizedLocation;
    //     this.ipCache.set(ip, location, this.DEFAULT_TTL);
    //   } else {
    //     location = await this.lookupCountry(ip);
    //     this.ipCache.set(ip, location, this.DEFAULT_TTL);
    //   }
    // }

    // req['userLocation'] = location; // attach to req object if needed downstream

    // requestLog.location = location;

    res.on('finish', () => {
      requestLog.statusCode = res.statusCode;
      requestLog.responseTime = `${Date.now() - startTime}ms`;
      this.logger.log(requestLog);
    });

    next();
  }

  private sanitizeQuery(query: any): any {
    const sanitizeData = { ...query }; // create a shallow copy to avoid mutating original

    if (Object.keys(sanitizeData).length === 0) return sanitizeData;

    if (Array.isArray(sanitizeData)) return sanitizeData.map((item) => this.sanitizeQuery(item));

    const sensitiveFields = [
      'password',
      'confirmPassword',
      'otp',
      'newPassword',
      'oldPassword',
      'currentPassword',
      'token',
    ];
    sensitiveFields.forEach((field) => {
      if (sanitizeData[field]) {
        sanitizeData[field] = '***protected***';
      }
    });
    return sanitizeData;
  }

  private sanitizePayload(payload: any): any {
    const sanitizeData = { ...payload }; // create a shallow copy to avoid mutating original

    if (Object.keys(sanitizeData).length === 0) return sanitizeData;

    if (Array.isArray(sanitizeData)) return sanitizeData.map((item) => this.sanitizePayload(item));

    const sensitiveFields = [
      'password',
      'confirmPassword',
      'otp',
      'newPassword',
      'oldPassword',
      'currentPassword',
      'token',
    ];
    sensitiveFields.forEach((field) => {
      if (sanitizeData[field]) {
        sanitizeData[field] = '***protected***';
      }
    });
    return sanitizeData;
  }

  private async lookupCountry(ip: string): Promise<string> {
    try {
      const res = await fetch(`https://ipinfo.io/${ip}/json?token=f85d3652c9a4b4`);
      const data: any = await res.json();
      if (data?.bogon) {
        return 'Local Network';
      } else return `${data?.city}, ${data?.country}` || 'Unknown';
    } catch (err) {
      this.logger.error({
        message: 'Failed to lookup country',
        ip,
        error: err instanceof Error ? err.message : String(err),
      });
      return 'Unknown';
    }
  }
}
