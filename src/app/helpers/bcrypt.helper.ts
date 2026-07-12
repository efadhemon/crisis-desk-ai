import { Injectable } from '@nestjs/common';
import { ENV } from '@src/env';
import { compare, hash } from 'bcryptjs';

@Injectable()
export class BcryptHelper {
  public hash(plainText: string, saltRounds: number = ENV.jwt.saltRound): Promise<string> {
    return hash(plainText, saltRounds);
  }

  public compareHash(plainText: string, hashString: string): Promise<boolean> {
    return compare(plainText, hashString);
  }
}
