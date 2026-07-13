import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { BcryptHelper } from './bcrypt.helper';
import { JWTHelper } from './jwt.helper';

const HELPERS = [BcryptHelper, JWTHelper];

@Global()
@Module({
  imports: [HttpModule],
  providers: [...HELPERS],
  exports: [...HELPERS, HttpModule],
})
export class HelpersModule {}
