import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ENV } from '@src/env';
import { FACEBOOK_STRATEGY } from '@src/shared/constants/strategy.constants';
import { Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, FACEBOOK_STRATEGY) {
  constructor() {
    super({
      clientID: ENV.facebook.clientId,
      clientSecret: ENV.facebook.secret,
      callbackURL: ENV.facebook.redirectUrl,
      profileFields: ['id', 'displayName', 'email', 'photos'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<void> {
    const { id, displayName, photos, emails } = profile;
    const user = {
      providerIdentifier: id,
      email: emails && emails?.length ? emails[0]?.value : null,
      firstName: displayName,
      lastName: '',
      picture: photos && photos?.length ? photos[0]?.value : null,
      accessToken,
      refreshToken,
    };
    done(null, user);
  }
}
