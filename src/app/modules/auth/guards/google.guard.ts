import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GOOGLE_STRATEGY } from '@src/shared/constants/strategy.constants';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard(GOOGLE_STRATEGY) {
  constructor() {
    super({
      accessType: 'offline',
    });
  }
}
