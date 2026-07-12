import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JWTHelper } from '@src/app/helpers';
import { ENV } from '@src/env';
import { AdminLoginDTO } from '../dtos/login.dto';

export interface IAdminLoginResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

@Injectable()
export class AdminAuthService {
  constructor(private readonly jwtHelper: JWTHelper) {}

  /**
   * Validate admin credentials (from ADMIN_EMAIL / ADMIN_PASSWORD) and issue a
   * JWT carrying an `admin` role, consumed by AdminGuard.
   */
  login(dto: AdminLoginDTO): IAdminLoginResult {
    const { email, password } = ENV.admin;

    if (!email || !password) {
      throw new UnauthorizedException('Admin credentials are not configured.');
    }

    if (dto.email !== email || dto.password !== password) {
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    const accessToken = this.jwtHelper.makeAccessToken({ sub: email, email, role: 'admin' });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: ENV.jwt.tokenExpireIn,
    };
  }
}
