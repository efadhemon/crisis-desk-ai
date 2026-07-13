import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { BcryptHelper } from './bcrypt.helper';
import { EmailHelper } from './email.helper';
import { HtmlHelper } from './html.helper';
import { JWTHelper } from './jwt.helper';
import { PdfGeneratorHelper } from './pdfGenerator.helper';

const HELPERS = [BcryptHelper, JWTHelper, EmailHelper, HtmlHelper, PdfGeneratorHelper];

const modules = [HttpModule];

@Global()
@Module({
  imports: [...modules],
  providers: [...HELPERS],
  exports: [...HELPERS],
})
export class HelpersModule {}
