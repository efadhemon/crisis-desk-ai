import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ENV } from '@src/env';
import { sign, verify } from 'jsonwebtoken';
import { GenericObject } from '../types';

@Injectable()
export class JWTHelper {
  public sign(payload: GenericObject, options: GenericObject): string {
    return sign(payload, ENV.jwt.secret, options);
  }

  public verify(token: string): GenericObject {
    try {
      return verify(token, ENV.jwt.secret) as any;
    } catch (_) {
      throw new UnauthorizedException('Unauthorized Access Detected');
    }
  }

  public extractToken(headers: GenericObject): string {
    let token: string = headers && headers.authorization ? headers.authorization : '';

    // remove Bearer from token and trim whitespace
    token = token.replace(/Bearer/, '')?.trim();
    return token;
  }

  public makeAccessToken(data: GenericObject, expiresIn?: string | number): string {
    const configAccess = {
      payload: {
        ...data,
      },
      options: {
        algorithm: 'HS512',
        expiresIn: expiresIn ?? ENV.jwt.tokenExpireIn,
      },
    };
    return this.sign(configAccess.payload, configAccess.options);
  }

  public makeRefreshToken(data: GenericObject, expiresIn?: string | number): string {
    const configAccess = {
      payload: {
        ...data,
      },
      options: {
        algorithm: 'HS512',
        expiresIn: expiresIn ?? ENV.jwt.refreshTokenExpireIn,
      },
    };
    return this.sign(configAccess.payload, configAccess.options);
  }

  public makePermissionToken(data: GenericObject, expiresIn?: string | number): string {
    const configAccess = {
      payload: {
        ...data,
      },
      options: {
        algorithm: 'HS512',
        expiresIn: expiresIn ?? ENV.jwt.refreshTokenExpireIn,
      },
    };
    return this.sign(configAccess.payload, configAccess.options);
  }

  public verifyRefreshToken(token: string): GenericObject {
    try {
      const decoded: any = verify(token, ENV.jwt.secret);
      if (decoded.isRefreshToken) {
        return decoded;
      } else {
        throw new ForbiddenException('Unauthorized Access Detected');
      }
    } catch (error) {
      console.error('🚀 ~ JWTHelper ~ verifyRefreshToken ~ error:', error);
      throw new ForbiddenException('Unauthorized Access Detected');
    }
  }
}
