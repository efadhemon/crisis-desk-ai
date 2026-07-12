// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { IApiUser } from '@src/app/interfaces';
// import { API_KEY_STRATEGY } from '@src/shared/constants/strategy.constants';
// import { Request } from 'express';
// import { Strategy } from 'passport-custom';

// @Injectable()
// export class ApiKeyStrategy extends PassportStrategy(Strategy, API_KEY_STRATEGY) {
//   constructor() {
//     super();
//   }

//   protected async validate(
//     req: Request & {
//       apiCredentials: IApiUser;
//     },
//   ): Promise<boolean> {
//     const apiKey = (req.headers['x-api-key'] || req.query.apiKey) as string;
//     const apiSecret = (req.headers['x-api-secret'] || req.query.apiSecret) as string;

//     // const apiKey = req.query.apiKey as string;
//     // const apiSecret = req.query.apiSecret as string;

//     if (!apiKey || !apiSecret) {
//       throw new UnauthorizedException('Invalid API key or secret');
//     }

//     const client = await this.clientService.findOne({
//       where: { apiKey, apiSecret },
//     });

//     if (!client) {
//       throw new UnauthorizedException('Invalid API key or secret');
//     }

//     if (!client.isActive) {
//       throw new UnauthorizedException('Client is not active');
//     }

//     req.apiCredentials = {
//       apiKey,
//       apiSecret,
//     };

//     return true;
//   }
// }
