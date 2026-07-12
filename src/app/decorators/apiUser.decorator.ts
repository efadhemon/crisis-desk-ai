// import { createParamDecorator } from '@nestjs/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IApiUser } from '../interfaces';

export const ApiUser = createParamDecorator((_: unknown, context: ExecutionContext): IApiUser => {
  const request = context.switchToHttp().getRequest();
  return request?.apiCredentials; // safely access apiCredentials
});
