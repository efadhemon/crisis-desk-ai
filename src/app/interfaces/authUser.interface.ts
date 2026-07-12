import { ENUM_USER_TYPES } from '../modules/user/enums';

export interface IAuthUser {
  id: string;
  userType: ENUM_USER_TYPES;
  email: string;
  fullName: string;
  phoneNumber: string;
  authProvider: string;
  roles: string[];
}

export interface ILginResponse {
  accessToken: string;
  refreshToken: string;
  permissionToken: string;
  user: null | IAuthUser;
}

export interface IValidateResponse {
  isNewUser: boolean;
  authSession: ILginResponse;
}
