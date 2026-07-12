import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { NextFunction, Request } from 'express';
import { JWTHelper } from '../helpers';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtHelper: JWTHelper) {}
  async use(req: Request, next: NextFunction): Promise<void> {
    const token = this.jwtHelper.extractToken(req.headers);
    const verifiedUser: any = await this.jwtHelper.verify(token);
    if (!verifiedUser) {
      throw new UnauthorizedException('Unauthorized Access Detected');
    }
    req['verifiedUser'] = verifiedUser.user;
    next();
  }
}
