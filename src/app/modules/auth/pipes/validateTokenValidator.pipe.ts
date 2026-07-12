import { Injectable } from '@nestjs/common';
import { JWTHelper } from '@src/app/helpers';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

interface ICustomArguments extends ValidationArguments {
  constraints: [(validationArguments: ValidationArguments) => { provider: string }];
}

@ValidatorConstraint({
  name: 'ValidateTokenValidatorPipe',
  async: true,
})
@Injectable()
export class ValidateTokenValidatorPipe implements ValidatorConstraintInterface {
  constructor(private readonly jwtHelper: JWTHelper) {}

  public async validate(value: string, args: ICustomArguments): Promise<boolean> {
    const [reqPayload] = args.constraints;
    const { provider } = typeof reqPayload === 'function' ? reqPayload(args) : reqPayload;

    if (provider === 'google') return true;

    const isValid = await this.jwtHelper.verify(value);
    return isValid ? true : false;
  }

  public defaultMessage(): string {
    return `Provided token is invalid`;
  }
}
