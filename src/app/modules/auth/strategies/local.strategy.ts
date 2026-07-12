import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { LOCAL_STRATEGY } from '@src/shared/constants/strategy.constants';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, LOCAL_STRATEGY) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'identifier',
    });
  }

  async validate(identifier: string, password: string): Promise<any> {
    const user = await this.authService.validateUserUsingIdentifierAndPassword(
      identifier,
      password,
    );

    return user;
  }
}
