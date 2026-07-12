import { User } from '@src/app/modules/user/entities/user.entity';

export type JwtPayloadType = Pick<User, 'username' | 'email' | 'phoneNumber'> & {
  email: 'username' | 'email' | 'phoneNumber';
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
};
