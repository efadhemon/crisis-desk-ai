import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BcryptHelper } from '@src/app/helpers';
import { IAuthUser, ILginResponse } from '@src/app/interfaces';
import { SuccessResponse } from '@src/app/types';
import { ENV } from '@src/env';
import { gen6digitOTP, identifyIdentifier } from '@src/shared';
import {
  commitTransaction,
  rollbackTransaction,
  startTransaction,
} from '@src/shared/utils/dborm.utils';
import { DataSource } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ENUM_AUTH_PROVIDERS, ENUM_USER_TYPES } from '../../user/enums';
import { LoginDTO } from '../dtos/login.dto';
import { RefreshTokenDTO } from '../dtos/refreshToken.dto';
import { RegisterDTO } from '../dtos/register.dto';
import { ResetPasswordDTO } from '../dtos/resetPassword.dto';
import { SendOtpDTO } from '../dtos/sendOtp.dto';
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
    private readonly jwtHelper: JWTHelper,
    private readonly bcryptHelper: BcryptHelper,
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
      await queryRunner.manager.save(User, payloadForNewUser);

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

  async getUserRolePermissions(
    _userId: string,
  ): Promise<{ roles: string[]; permissions: string[] }> {
    return {
      roles: [],
      permissions: [],
    };
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

    const expiresIn = 5;
    const otp = gen6digitOTP();
    const hash = this.jwtHelper.generateOtpHash(identifier, otp, expiresIn);

    const messageType =
      verificationType === ENUM_VERIFICATION_TYPES.SIGN_UP ? 'Sign Up' : 'Reset Password';
    const channel = sentTo.isEmail ? 'email' : 'phone number';
    const message = `Your OTP for ${messageType} has been generated. It will expire in ${expiresIn} minutes.`;

    if (!ENV.isProduction) {
      console.info(`[dev] OTP for ${channel} ${identifier}: ${otp}`);
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
