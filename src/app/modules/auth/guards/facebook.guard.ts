import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FACEBOOK_STRATEGY } from '@src/shared/constants/strategy.constants';

@Injectable()
export class FacebookOAuthGuard extends AuthGuard(FACEBOOK_STRATEGY) {
  constructor() {
    super({
      // Any additional options specific to Facebook OAuth can be provided here
      // For example:
      scope: ['email'],
      // Add any other required options according to the Facebook OAuth documentation
    });
  }
}
