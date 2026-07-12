import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BcryptHelper, EmailHelper } from '@src/app/helpers';
import { FileUploadHelper } from '@src/app/helpers/fileUpload.helper';
import { IAuthUser, ILginResponse, IValidateResponse } from '@src/app/interfaces';
import { SuccessResponse } from '@src/app/types';
import { ENV } from '@src/env';
import { gen6digitOTP, identifyIdentifier } from '@src/shared';
import {
  commitTransaction,
  rollbackTransaction,
  startTransaction,
} from '@src/shared/utils/dborm.utils';
import * as Crypto from 'crypto';
import authenticator from 'otplib';
import { toDataURL } from 'qrcode';
import { firstValueFrom } from 'rxjs';
import { DataSource } from 'typeorm';
import { RoleService } from '../../acl/services/role.service';
import { GlobalConfigService } from '../../globalConfig/services/globalConfig.service';

import { ENUM_NOTIFICATION_TYPE } from '../../notification/enums';
import { EmailNotificationService } from '../../notification/services/emailNotification.service';
import { SmsNotificationService } from '../../notification/services/smsNotification.service';
import { User } from '../../user/entities/user.entity';
import { UserRole } from '../../user/entities/userRole.entity';
import { ENUM_AUTH_PROVIDERS, ENUM_USER_TYPES } from '../../user/enums';
import { UserRoleService } from '../../user/services/userRole.service';
import { Authenticate2faDTO } from '../dtos/authenticate2fa.dto';
import { FacebookAuthRequestDTO } from '../dtos/facebookAuthRequest.dto';
import { GoogleAuthRequestDTO } from '../dtos/googleAuthRequest.dto';
import { LoginDTO } from '../dtos/login.dto';
import { RefreshTokenDTO } from '../dtos/refreshToken.dto';
import { RegisterDTO } from '../dtos/register.dto';
import { ResetPasswordDTO } from '../dtos/resetPassword.dto';
import { SendOtpDTO } from '../dtos/sendOtp.dto';
import { SocialAuthValidateDTO } from '../dtos/socialAuthValidate.dto';
import { VerifyOtpDTO } from '../dtos/verifyOtp.dto';
import { VerifyResetPasswordDTO } from '../dtos/verifyResetPassword.dto';
import { ENUM_VERIFICATION_TYPES } from '../enums';
import { JWTHelper } from './../../../helpers/jwt.helper';
import { UserService } from './../../user/services/user.service';
import { ChangePasswordDTO } from './../dtos/changePassword.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly userRoleService: UserRoleService,
    private readonly http: HttpService,
    private readonly jwtHelper: JWTHelper,
    private readonly bcryptHelper: BcryptHelper,
    private readonly emailHelper: EmailHelper,
    private readonly globalConfigService: GlobalConfigService,
    private readonly fileUploadHelper: FileUploadHelper,
    private readonly emailNotificationService: EmailNotificationService,
    private readonly smsNotificationService: SmsNotificationService,
  ) {}

  async loginResponse(
    userId: string,
    options: { message?: string; remember?: boolean; rememberDays?: number } = {},
  ): Promise<SuccessResponse<ILginResponse>> {
    const { message, remember = false, rememberDays = 7 } = options;
    if (rememberDays < 0) throw new BadRequestException('Remember days must be a positive number');

    if (!userId) throw new UnauthorizedException('User ID is required for login response');

    const user = await this.userService.findOne({
      where: { id: userId },
      select: {
        id: true,
        userType: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        authProvider: true,
      },
    });
    if (!user) throw new UnauthorizedException('Account not found');

    const { roles, permissions } = await this.getUserRolePermissions(user.id);

    const tokenPayload = {
      user: {
        id: user.id,
        userType: user.userType,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        authProvider: user.authProvider,
        roles,
      } satisfies IAuthUser,
    };

    const refreshTokenPayload = {
      isRefreshToken: true,
      user: {
        id: user.id,
      },
    };

    const permissionTokenPayload = {
      permissions,
    };

    const tokenExpireIn = remember ? rememberDays + 'd' : ENV.jwt.tokenExpireIn;
    const refreshTokenExpireIn = remember ? rememberDays + 'd' : ENV.jwt.refreshTokenExpireIn;

    const accessToken = this.jwtHelper.makeAccessToken(tokenPayload, tokenExpireIn);
    const refreshToken = this.jwtHelper.makeRefreshToken(refreshTokenPayload, refreshTokenExpireIn);
    const permissionToken = this.jwtHelper.makePermissionToken(
      permissionTokenPayload,
      refreshTokenExpireIn,
    );

    return new SuccessResponse(message ?? 'Login successfully', {
      accessToken,
      refreshToken,
      permissionToken,
      user: ENV.isProduction ? null : { ...tokenPayload.user },
    });
  }

  async validateUserUsingIdentifierAndPassword(
    identifier: string,
    password: string,
  ): Promise<User> {
    const whereConditions: any = {};
    const query = await identifyIdentifier(identifier);
    whereConditions[query.key] = query.value;

    const user = await this.userService.findOne({
      where: {
        ...whereConditions,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const isPasswordValid = await this.bcryptHelper.compareHash(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    return user;
  }

  async sendOtp(payload: SendOtpDTO): Promise<SuccessResponse> {
    const response = await this.otpSentForVerification({
      verificationType: payload?.verificationType,
      identifier: payload?.identifier,
    });

    return new SuccessResponse(`OTP sent to ${response.identifier}.`, response);
  }

  async verifyOtp(payload: VerifyOtpDTO): Promise<SuccessResponse<ILginResponse>> {
    const { identifier, otp, hash } = payload;

    const whereConditions = {};
    const identify = identifyIdentifier(identifier);
    whereConditions[identify.key] = identify.value;

    const user = await this.userService.findOne({
      where: {
        ...whereConditions,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Account not found with this identifier');
    }

    const isOtpVerified = this.jwtHelper.verifyOtpHash(identifier, otp, hash);

    if (!isOtpVerified) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.userService.repo.update(user.id, { isVerified: true });

    return this.loginResponse(user.id, {
      message: 'Account verified successfully',
      remember: payload.remember,
      rememberDays: payload.rememberDays,
    });
  }

  async resetPassword(payload: ResetPasswordDTO): Promise<SuccessResponse> {
    const response = await this.otpSentForVerification({
      verificationType: ENUM_VERIFICATION_TYPES.RESET_PASSWORD,
      identifier: payload?.identifier,
    });
    return new SuccessResponse(`OTP sent to ${response.identifier}.`, response);
  }

  async verifyResetPassword(
    payload: VerifyResetPasswordDTO,
  ): Promise<SuccessResponse<ILginResponse>> {
    const { identifier, otp, newPassword, hash } = payload;

    const whereConditions = {};
    const identify = identifyIdentifier(identifier);
    whereConditions[identify.key] = identify.value;

    const user = await this.userService.isExist({
      ...whereConditions,
    });

    if (!user) {
      throw new UnauthorizedException('Account not found with this identifier');
    }

    const isOtpVerified = this.jwtHelper.verifyOtpHash(identifier, otp, hash);

    if (!isOtpVerified) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.userService.repo.update(user.id, {
      password: newPassword,
      isVerified: true,
    });

    return this.loginResponse(user.id, {
      message: 'Password reset successfully.',
      remember: payload.remember,
      rememberDays: payload.rememberDays,
    });
  }

  async changePassword(
    payload: ChangePasswordDTO,
    authUser: IAuthUser,
  ): Promise<SuccessResponse<ILginResponse>> {
    const { oldPassword, newPassword } = payload;

    const user = await this.userService.findOne({
      where: { id: authUser.id },
      select: {
        id: true,
        phoneNumber: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User does not exists');
    }

    const isPasswordMatched = await this.bcryptHelper.compareHash(oldPassword, user.password);

    if (!isPasswordMatched) {
      throw new BadRequestException('Invalid old password');
    }

    await this.userService.repo.update(user.id, { password: newPassword });

    return this.loginResponse(user.id, {
      message: 'Password changed successfully.',
      remember: payload.remember,
      rememberDays: payload.rememberDays,
    });
  }

  async registerUser(
    payload: RegisterDTO & { userType: ENUM_USER_TYPES },
  ): Promise<SuccessResponse> {
    if (!payload.userType) {
      throw new BadRequestException('User type is required');
    }

    const queryRunner = await startTransaction(this.dataSource);
    try {
      const whereConditions = [];
      const identify = identifyIdentifier(payload?.identifier);
      whereConditions.push({ [identify.key]: identify.value });

      const isExist = await queryRunner.manager.findOne(User, {
        where: whereConditions.length ? whereConditions : undefined, // Avoid invalid queries
        withDeleted: true,
      });

      if (isExist && isExist.deletedAt) {
        throw new BadRequestException('User is deleted. Please contact support');
      }

      if (isExist && identify.key === 'email') {
        throw new ConflictException('Already registered via this email. Try login');
      } else if (isExist && identify.key === 'phoneNumber') {
        throw new ConflictException('Already registered via this phone number. Try login');
      } else if (isExist && identify.key === 'username') {
        // Because username is not supported while registering
        throw new ConflictException('Invalid identifier');
      }

      const payloadForNewUser: Partial<User> = {
        userType: payload.userType,
        firstName: payload.firstName,
        lastName: payload.lastName,
        password: payload.password,
        [identify.key]: identify.value,
      };

      // Create User
      const createdUser = await queryRunner.manager.save(User, payloadForNewUser);

      const targetRole = await this.roleService.getTargetRoleByUserType(payload.userType);
      if (targetRole) {
        // Assign Role to User
        await queryRunner.manager.save(UserRole, {
          userId: createdUser.id,
          roleId: targetRole.id,
        });
      }

      await commitTransaction(queryRunner);

      const response = await this.otpSentForVerification({
        verificationType: ENUM_VERIFICATION_TYPES.SIGN_UP,
        identifier: payload?.identifier,
      });

      return new SuccessResponse('User Registered Successfully', response);
    } catch (error) {
      await rollbackTransaction(queryRunner);
      console.error('🚀 ~ AuthService ~ registerUser ~ error:', error);
      throw error;
    }
  }

  async loginUser(payload: LoginDTO, userType: ENUM_USER_TYPES): Promise<SuccessResponse> {
    if (!userType) throw new UnauthorizedException('User type is required for login');

    const identify = identifyIdentifier(payload.identifier);
    const user = await this.userService.findOne({
      where: {
        [identify.key]: identify.value,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        authProvider: true,
        userType: true,
        password: true,
        isActive: true,
        isVerified: true,
        isTwoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Account not found');
    }

    if (user.authProvider !== ENUM_AUTH_PROVIDERS.SYSTEM) {
      throw new UnauthorizedException(`Please login using ${user.authProvider} provider`);
    }

    if (user.userType !== userType) {
      throw new UnauthorizedException('You are not eligible to login here');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account is deactivated. Please contact support.');
    }

    const isPasswordMatch = await this.bcryptHelper.compareHash(payload.password, user.password);

    if (!isPasswordMatch) {
      throw new BadRequestException('Password does not match');
    }

    if (!user.isVerified) {
      const response = await this.otpSentForVerification({
        verificationType: ENUM_VERIFICATION_TYPES.SIGN_UP,
        identifier: payload.identifier,
      });

      return new SuccessResponse('User is not verified...! Please Verify First For Login', {
        ...response,
        isVerified: false,
      });
    }

    if (user?.isTwoFactorEnabled) {
      return new SuccessResponse('Two Factor Authentication Required !!', {
        identifier: payload.identifier,
        isTwoFactorEnabled: true,
      });
    }

    return this.loginResponse(user.id, {
      remember: payload.remember,
      rememberDays: payload.rememberDays,
    });
  }

  async refreshToken(payload: RefreshTokenDTO): Promise<SuccessResponse<ILginResponse>> {
    const decoded = this.jwtHelper.verifyRefreshToken(payload.refreshToken);
    if (!decoded.user || !decoded.user.id) {
      throw new BadRequestException('Invalid token');
    }

    return this.loginResponse(decoded.user.id, {
      message: 'Logged in successfully via refresh token',
      remember: payload.remember,
      rememberDays: payload.rememberDays,
    });
  }

  async getUserRolePermissions(userId: string): Promise<any> {
    const { data: userRoles } = await this.userRoleService.findAllBase(
      { userId: userId },
      {
        relations: { role: true },
      },
    );

    const roles = userRoles.map((uR) => uR.role.title);
    const permissions = await this.userRoleService.getUserPermissions(userId);
    return {
      roles,
      permissions,
    };
  }

  async googleAuthRequest(query: GoogleAuthRequestDTO & { role?: string }): Promise<string> {
    const state = JSON.stringify({ provider: 'google', ...query });
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];
    const authorizationUrl =
      'https://accounts.google.com/o/oauth2/v2/auth' +
      `?client_id=${ENV.google.clientId}` +
      `&redirect_uri=${ENV.google.redirectUrl}` +
      '&response_type=code' +
      '&scope=' +
      scopes.join(' ') +
      '&state=' +
      state;
    return authorizationUrl;
  }

  async googleLogin(
    userData: Record<string, any>,
    state: string,
  ): Promise<{
    callBackUrl: string;
  }> {
    if (!userData) {
      throw new BadRequestException('No user from google');
    }
    const additionalData = JSON.parse(state) as {
      webRedirectUrl: string;
      provider: string;
      role?: string;
    };
    const isExist = await this.userService.findOne({
      where: { email: userData.email },
    });

    if (!isExist) {
      const queryRunner = await startTransaction(this.dataSource);
      try {
        const newUserData: Partial<User> = {
          fullName: userData.fullName,
          email: userData.email,
          authProvider: ENUM_AUTH_PROVIDERS.GOOGLE,
          password: Crypto.randomBytes(20).toString('hex'),
          isVerified: true,
        };
        const createdUser = await queryRunner.manager.save(Object.assign(new User(), newUserData));

        if (!createdUser) {
          throw new BadRequestException('Cannot create user');
        }
        await commitTransaction(queryRunner);
      } catch (error) {
        console.error('🚀 ~ AuthService ~ error:', error);
        await rollbackTransaction(queryRunner);
      }
    }

    const newCreatedUser = await this.userService.findOne({
      where: { email: userData.email },
    });

    if (!newCreatedUser) {
      throw new BadRequestException('User not created');
    }

    //? Role assignment
    if (additionalData?.role) {
      const role = await this.roleService.findOrCreateRole(additionalData.role);
      if (role) {
        const isUserRoleExist = await this.userRoleService.findOne({
          where: {
            userId: newCreatedUser.id,
            roleId: role.id,
          },
        });
        if (!isUserRoleExist) {
          await this.userRoleService.createOneBase({
            userId: newCreatedUser.id,
            roleId: role.id,
          });
        }
      }
    }

    const callBackUrl = `${additionalData.webRedirectUrl}?token=${userData?.accessToken}&provider=${additionalData.provider}`;

    return {
      callBackUrl,
    };
  }

  async facebookAuthRequest(query: FacebookAuthRequestDTO & { role?: string }): Promise<string> {
    const state = JSON.stringify({ provider: 'facebook', ...query });
    const scopes = ['email'];
    const authorizationUrl = `https://www.facebook.com/${ENV.facebook.apiVersion}/dialog/oauth?client_id=${
      ENV.facebook.clientId
    }&redirect_uri=${ENV.facebook.redirectUrl}&scope=${scopes.join(',')}&state=${state}&config_id=${
      ENV.facebook.configId
    }`;
    // console.log('🚀 ~ AuthService ~ facebookAuthRequest ~ authorizationUrl:', authorizationUrl);
    return authorizationUrl;
  }

  async facebookLogin(
    userData: Record<string, any>,
    state: string,
  ): Promise<{
    callBackUrl: string;
  }> {
    if (!userData) {
      throw new BadRequestException('No user from facebook');
    }
    const additionalData = JSON.parse(state) as {
      webRedirectUrl: string;
      provider: string;
      role?: string;
    };
    if (!userData?.email) {
      throw new BadRequestException(
        'Email is required, but your facebook account does not have it',
      );
      // userData.email = `${userData.providerIdentifier}@wagehat.com`;
    }

    const isExist = await this.userService.findOne({
      where: { email: userData.email },
    });

    if (!isExist) {
      const queryRunner = await startTransaction(this.dataSource);
      try {
        const newUserData: Partial<User> = {
          fullName: userData.fullName,
          email: userData.email,
          authProvider: ENUM_AUTH_PROVIDERS.FACEBOOK,
          password: Crypto.randomBytes(20).toString('hex'),
          isVerified: true,
        };
        const createdUser = await queryRunner.manager.save(Object.assign(new User(), newUserData));

        if (!createdUser) {
          throw new BadRequestException('Cannot create user');
        }

        await commitTransaction(queryRunner);
      } catch (error) {
        // console.log('🚀 ~ AuthService ~ error:', error);
        await rollbackTransaction(queryRunner);
        throw error;
      }
    }

    const newCreatedUser = await this.userService.findOne({
      where: { email: userData.email },
    });

    if (!newCreatedUser) {
      throw new BadRequestException('User not created');
    }

    //? Role assignment
    if (additionalData?.role) {
      const role = await this.roleService.findOrCreateRole(additionalData.role);
      if (role) {
        const isUserRoleExist = await this.userRoleService.findOne({
          where: {
            userId: newCreatedUser.id,
            roleId: role.id,
          },
        });
        if (!isUserRoleExist) {
          await this.userRoleService.createOneBase({
            userId: newCreatedUser.id,
            roleId: role.id,
          });
        }
      }
    }

    const callBackUrl = `${additionalData.webRedirectUrl}?token=${userData?.accessToken}&provider=${additionalData.provider}`;

    return {
      callBackUrl,
    };
  }

  async validate(
    payload: SocialAuthValidateDTO & { userType: ENUM_USER_TYPES },
  ): Promise<SuccessResponse<IValidateResponse>> {
    if (payload.provider === ENUM_AUTH_PROVIDERS.GOOGLE)
      return this.validateUsingGoogleAuth(payload);
    if (payload.provider === ENUM_AUTH_PROVIDERS.FACEBOOK)
      return this.validateUsingFacebookAuth(payload);
    return this.validateUsingSystemAuth(payload);
  }

  async validateUsingFacebookAuth(
    payload: SocialAuthValidateDTO & { userType: ENUM_USER_TYPES },
  ): Promise<SuccessResponse<IValidateResponse>> {
    const queryRunner = await startTransaction(this.dataSource);

    try {
      if (!payload.userType) {
        throw new BadRequestException('User type is required');
      }

      const fields = 'id,first_name,last_name,name,email,picture.width(480).height(480)';
      const facebookUrl = `https://graph.facebook.com/v24.0/me?fields=${fields}&access_token=${payload.token}`;

      const facebookResponse = this.http.get(facebookUrl);
      const responseData = (await firstValueFrom(facebookResponse))?.data;
      if (!responseData?.email) {
        throw new BadRequestException(
          'Email is required, but your facebook account does not have it',
        );
      }

      let isNewUser = false;
      let user = await queryRunner.manager.findOne(User, {
        where: { email: responseData.email },
        withDeleted: true,
      });

      if (user && user.deletedAt) {
        throw new BadRequestException('User is deleted. Please contact support');
      }

      if (!user) {
        const avatarData = responseData?.picture?.data?.url
          ? await this.fileUploadHelper.uploadFromUrl(responseData?.picture?.data?.url)
          : null;

        const payloadForNewUser: User = {
          userType: payload.userType,
          firstName: responseData.first_name,
          lastName: responseData.last_name,
          fullName: responseData.name,
          email: responseData?.email,
          avatar: avatarData.url,
          authProvider: ENUM_AUTH_PROVIDERS.FACEBOOK,
          authProviderMetaInfo: {
            id: responseData.id,
            email: responseData?.email,
            name: responseData?.name,
            provider: ENUM_AUTH_PROVIDERS.FACEBOOK,
            authenticator: {
              id: '',
              title: '',
            },
          },
          isVerified: true,
        };

        // Create User
        const createdUser = await queryRunner.manager.save(User, payloadForNewUser);

        const targetRole = await this.roleService.getTargetRoleByUserType(payload.userType);
        if (targetRole) {
          // Assign Role to User
          await queryRunner.manager.save(UserRole, {
            userId: createdUser.id,
            roleId: targetRole.id,
          });
        }

        await commitTransaction(queryRunner);

        user = createdUser; // Update user to the newly created one
        isNewUser = true; // Mark as new user
      }

      const loginResponseData = await this.loginResponse(user.id, {
        message: isNewUser ? 'Registered and logged in successfully' : 'Logged in successfully',
        remember: payload.remember,
        rememberDays: payload.rememberDays,
      });
      return new SuccessResponse<IValidateResponse>('Validated successfully', {
        authSession: loginResponseData.data,
        isNewUser,
      });
    } catch (error) {
      await rollbackTransaction(queryRunner);
      console.error('🚀 ~ AuthService ~ validateUsingFacebookAuth ~ error:', error);
      throw error;
    }
  }

  async validateUsingGoogleAuth(
    payload: SocialAuthValidateDTO & { userType: ENUM_USER_TYPES },
  ): Promise<SuccessResponse<IValidateResponse>> {
    const queryRunner = await startTransaction(this.dataSource);

    try {
      if (!payload.userType) {
        throw new BadRequestException('User type is required');
      }

      const googleUrl = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${payload.token}`;
      const googleResponse = this.http.get(googleUrl);
      const responseData = (await firstValueFrom(googleResponse))?.data;
      if (!responseData?.email) {
        throw new BadRequestException(
          'Email is required, but your google response does not have it',
        );
      }

      let isNewUser = false;
      let user = await queryRunner.manager.findOne(User, {
        where: { email: responseData.email },
        withDeleted: true,
      });

      if (user && user.deletedAt) {
        throw new BadRequestException('User is deleted. Please contact support');
      }

      if (!user) {
        const payloadForNewUser: User = {
          userType: payload.userType,
          firstName: responseData.given_name,
          lastName: responseData.family_name,
          fullName: responseData.name,
          email: responseData?.email,
          avatar: responseData?.picture?.replace('s96-c', 's500-c'),
          authProvider: ENUM_AUTH_PROVIDERS.GOOGLE,
          authProviderMetaInfo: {
            id: responseData.id,
            email: responseData?.email,
            name: responseData?.name,
            provider: ENUM_AUTH_PROVIDERS.GOOGLE,
            authenticator: {
              id: '',
              title: '',
            },
          },
          isVerified: true,
        };

        const createdUser = await queryRunner.manager.save(User, payloadForNewUser);

        const targetRole = await this.roleService.getTargetRoleByUserType(payload.userType);
        if (targetRole) {
          // Assign Role to User
          await queryRunner.manager.save(UserRole, {
            userId: createdUser.id,
            roleId: targetRole.id,
          });
        }

        await commitTransaction(queryRunner);

        user = createdUser; // Update user to the newly created one
        isNewUser = true; // Mark as new user
      }

      const loginResponseData = await this.loginResponse(user.id, {
        message: isNewUser ? 'Registered and logged in successfully' : 'Logged in successfully',
        remember: payload.remember,
        rememberDays: payload.rememberDays,
      });
      return new SuccessResponse<IValidateResponse>('Validated successfully', {
        isNewUser,
        authSession: loginResponseData.data,
      });
    } catch (error) {
      await rollbackTransaction(queryRunner);
      console.error('🚀 ~ AuthService ~ validateUsingGoogleAuth ~ error:', error);
      throw error;
    }
  }

  async validateUsingSystemAuth(
    payload: SocialAuthValidateDTO,
  ): Promise<SuccessResponse<IValidateResponse>> {
    const decodedToken = this.jwtHelper.verify(payload.token) as {
      userId: string;
    };

    const loginResponseData = await this.loginResponse(decodedToken.userId, {
      message: 'Logged in successfully',
      remember: payload.remember,
      rememberDays: payload.rememberDays,
    });
    return new SuccessResponse<IValidateResponse>('Validated successfully', {
      isNewUser: false,
      authSession: loginResponseData.data,
    });
  }

  async turnOn2fa(authUser: IAuthUser): Promise<SuccessResponse> {
    const whereConditions = {};
    const identify = identifyIdentifier(authUser?.email ?? authUser?.phoneNumber);
    whereConditions[identify.key] = identify.value;

    const user = await this.userService.findOne({
      where: { ...whereConditions },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.isTwoFactorEnabled) {
      throw new BadRequestException('Two factor auth is already turned on');
    }

    const secret = authenticator.generateSecret();
    await this.userService.saveOne({
      id: user.id,
      twoFactorSecret: secret,
      isTwoFactorEnabled: true,
    });
    // TODO: Clear secret after 30 seconds

    const otpAuthUrl = authenticator.generateURI({
      issuer: ENV.authenticator.google.issuer,
      label: identify.value,
      secret,
    });

    const qrCode = await toDataURL(otpAuthUrl);

    return new SuccessResponse('Two factor auth turned on', {
      qrCode,
    });
  }

  async turnOff2fa(authUser: IAuthUser): Promise<SuccessResponse> {
    const whereConditions: any = {};
    const identify = identifyIdentifier(authUser.email ?? authUser.phoneNumber);
    whereConditions[identify.key] = identify.value;

    const user = await this.userService.findOne({
      where: { ...whereConditions },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    if (!user.isTwoFactorEnabled) {
      throw new BadRequestException('Two factor auth is already turned off');
    }

    await this.userService.saveOne({
      id: user.id,
      twoFactorSecret: null,
      isTwoFactorEnabled: false,
    });

    return new SuccessResponse('Two factor auth turned off');
  }

  async authenticate2fa(payload: Authenticate2faDTO): Promise<SuccessResponse<ILginResponse>> {
    const whereConditions = {};
    const identify = identifyIdentifier(payload.identifier);
    whereConditions[identify.key] = identify.value;

    const user = await this.userService.findOne({
      where: { ...whereConditions },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const verifiedUser = authenticator.verify({
      token: payload.code,
      secret: user.twoFactorSecret,
    });

    if (!verifiedUser) {
      throw new UnauthorizedException('Invalid code');
    }

    return this.loginResponse(user.id, { message: 'Two factor verified' });
  }

  async otpSentForVerification(payload: {
    verificationType: ENUM_VERIFICATION_TYPES;
    identifier?: string;
  }): Promise<{ message: string; identifier: string; hash: string; otp: number }> {
    const { verificationType, identifier } = payload;

    const whereConditions = {};
    const identify = identifyIdentifier(identifier);
    whereConditions[identify.key] = identify.value;

    const user = await this.userService.isExist({
      ...whereConditions,
    });

    if (!user) {
      throw new UnauthorizedException('Account not found with this identifier');
    }

    const sentTo = { identifier, isEmail: false, isPhoneNumber: false };
    if (identify?.key === 'email') {
      sentTo.isEmail = true;
    } else if (identify.key === 'phoneNumber') {
      sentTo.isPhoneNumber = true;
    } else {
      throw new BadRequestException(
        'Identifier should be email or phone number for verification !',
      );
    }

    const config = await this.globalConfigService.getConfig();
    const expiresIn = config.otpExpiresInMin;

    const otp = gen6digitOTP();
    const hash = this.jwtHelper.generateOtpHash(identifier, otp, expiresIn);

    let message: string;
    const messageType =
      verificationType === ENUM_VERIFICATION_TYPES.SIGN_UP ? 'Sign Up' : 'Reset Password';

    if (sentTo.isEmail) {
      let template = '';
      if (verificationType === ENUM_VERIFICATION_TYPES.SIGN_UP) {
        template = 'account-verify';
      }
      if (verificationType === ENUM_VERIFICATION_TYPES.RESET_PASSWORD) {
        template = 'reset-password';
      }
      const emailContent = await this.emailHelper.createEmailContent(
        { otp, clientName: user.fullName, expiresIn, copyRightYear: new Date().getFullYear() },
        template,
      );
      try {
        await this.emailNotificationService.createNotification({
          type: ENUM_NOTIFICATION_TYPE.PROFILE_VERIFIED,
          title: `Verification OTP - ${user.fullName}`,
          recipient: identifier,
          subject: `Verification OTP - ${user.fullName}`,
          body: emailContent,
        });
        message = `Your OTP for ${messageType} is send to your email. It will expire in ${expiresIn} minutes.`;
      } catch (error) {
        message = `Error sending OTP to your email. Please try again later.`;
        console.error('🚀 ~ AuthService ~ otpSentForVerification ~ type:email ~ error:', error);
      }
    } else if (sentTo.isPhoneNumber) {
      const smsContent = `Your OTP for ${verificationType} is ${otp}. It will expire in ${expiresIn} minutes.`;
      try {
        await this.smsNotificationService.createNotification({
          type: ENUM_NOTIFICATION_TYPE.PROFILE_VERIFIED,
          title: `Verification OTP - ${user.fullName}`,
          recipient: identifier,
          body: smsContent,
        });
        message = `Your OTP for ${messageType} is send to your phone number. It will expire in ${expiresIn} minutes.`;
      } catch (error) {
        console.error('🚀 ~ AuthService ~ otpSentForVerification ~ type:phone ~ error:', error);
        message = `Error sending OTP to your phone number. Please try again later.`;
      }
    }

    const response = {
      message,
      identifier: identifier,
      hash,
      otp: ENV.isProduction ? null : otp,
    };
    return response;
  }
}
