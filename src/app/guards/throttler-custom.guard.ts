import { ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerLimitDetail,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JWTHelper } from '../helpers';
import { IAuthUser } from '../interfaces';

// Custom exception for throttling
export class ThrottlerCustomException extends HttpException {
  constructor(public readonly throttlerLimitDetail: ThrottlerLimitDetail) {
    super('Too many requests. Please slow down.', HttpStatus.TOO_MANY_REQUESTS);
  }
}

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
    this.jwtHelper = new JWTHelper(); // ✅ Reuse single instance
  }

  private readonly jwtHelper: JWTHelper;

  /**
   * Override to generate tracker based on userId or IP
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const request = req as Request;
    return this.generateTracer(request);
  }

  /**
   * Generate key per endpoint (method + url) and user/IP
   * Format: user-{id}~post~api/v1/auth/login or ip-192.168.1.1~get~api/v1/users
   */
  protected generateKey(context: ExecutionContext): string {
    const req = context.switchToHttp().getRequest();
    const tracker = this.generateTracer(req);
    const method = req.method.toLowerCase();
    const path = req.route?.path || req.originalUrl.split('?')[0]; // Remove query params

    // Format: tracker~method~path
    return `${tracker}~${method}~${path}`;
  }

  /**
   * Throw custom exception when rate limit is exceeded
   */
  protected async throwThrottlingException(
    _context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new ThrottlerCustomException(throttlerLimitDetail);
  }

  /**
   * Extract authenticated user from request
   */
  private getAuthUserFromRequest(req: Request): IAuthUser | null {
    try {
      const token = this.jwtHelper.extractToken(req.headers);
      if (!token) return null;

      const decoded = this.jwtHelper.verify(token);
      return decoded?.user || null;
    } catch (_err) {
      return null;
    }
  }

  /**
   * Generate tracker string (user ID or IP)
   */
  private generateTracer(req: Request): string {
    const authUser = this.getAuthUserFromRequest(req);

    if (authUser?.id) {
      return `user-${authUser.id}`;
    }

    // Fallback to IP address
    return `ip-${this.getIpAddress(req)}`;
  }

  /**
   * Extract IP address from request (with proxy support)
   */
  private getIpAddress(request: Request): string {
    // Check for IP in various headers (proxy support)
    const forwarded = request.headers['x-forwarded-for'];

    if (forwarded) {
      const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
      if (ip) return ip;
    }

    // Check other common headers
    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return typeof realIp === 'string' ? realIp : realIp[0];
    }

    // Fallback to connection remote address
    return request.ip || request.socket?.remoteAddress || 'unknown';
  }
}
