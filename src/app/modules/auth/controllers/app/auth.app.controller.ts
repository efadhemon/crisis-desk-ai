import { Body, Controller, Get, Patch, Post, Query, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@src/app/decorators';
import { Public } from '@src/app/decorators/publicRoute.decorator';
import { SkipKeyCheck } from '@src/app/decorators/skipKeyCheck.decorator';
import { AppRequestInterceptor } from '@src/app/interceptors';
import { IAuthUser, ILginResponse, IValidateResponse } from '@src/app/interfaces';
import { ENUM_USER_TYPES } from '@src/app/modules/user/enums';
import { SuccessResponse } from '@src/app/types';
import { AccountDataDeleteDTO } from '../../dtos/accountDataDelete.dto';
import { ChangePasswordDTO } from '../../dtos/changePassword.dto';
import { LoginDTO } from '../../dtos/login.dto';
import { RefreshTokenDTO } from '../../dtos/refreshToken.dto';
import { RegisterDTO } from '../../dtos/register.dto';
import { ResetPasswordDTO } from '../../dtos/resetPassword.dto';
import { SendOtpDTO } from '../../dtos/sendOtp.dto';
import { SocialAuthValidateDTO } from '../../dtos/socialAuthValidate.dto';
import { VerifyOtpDTO } from '../../dtos/verifyOtp.dto';
import { VerifyResetPasswordDTO } from '../../dtos/verifyResetPassword.dto';
import { AuthService } from '../../services/auth.service';

@ApiTags('Auth')
@ApiBearerAuth()
@ApiSecurity('X-Panel-Key')
@ApiSecurity('X-Api-Key')
@UseInterceptors(AppRequestInterceptor)
@Controller('app/auth')
export class AuthAppController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('validate')
  async validate(@Body() body: SocialAuthValidateDTO): Promise<SuccessResponse<IValidateResponse>> {
    return this.service.validate({
      ...body,
      userType: ENUM_USER_TYPES.USER,
    });
  }

  @Public()
  @SkipKeyCheck()
  @Post('delete-account-data')
  async deleteAccountData(@Body() body: AccountDataDeleteDTO): Promise<SuccessResponse> {
    console.warn('🚀 ~ AuthAppController ~ deleteAccountData ~ body:', body);
    return new SuccessResponse(
      'Your request to delete account data is accepted & will be deleted within 14 days!',
    );
  }

  @Public()
  @SkipKeyCheck()
  @Get('delete-account-data')
  async deleteAccountDataByGet(@Query() query: AccountDataDeleteDTO): Promise<SuccessResponse> {
    console.warn('🚀 ~ AuthAppController ~ deleteAccountData ~ query:', query);
    return new SuccessResponse(
      'Your request to delete account data is accepted & will be deleted within 14 days!',
    );
  }

  // @Post('2fa/turn-on')
  //
  // @UseInterceptors(ResponseInterceptor)
  // async turnOn2fa(@AuthUser() authUser: IAuthUser): Promise<SuccessResponse> {
  //   return this.service.turnOn2fa(authUser);
  // }

  // @Post('2fa/turn-off')
  //
  // @UseInterceptors(ResponseInterceptor)
  // async turnOff2fa(@AuthUser() authUser: IAuthUser): Promise<SuccessResponse> {
  //   return this.service.turnOff2fa(authUser);
  // }

  // @Post('2fa/authenticate')
  //
  // @UseInterceptors(ResponseInterceptor)
  // async authenticate2fa(@Body() body: Authenticate2faDTO): Promise<SuccessResponse<ILginResponse>> {
  //   return this.service.authenticate2fa(body);
  // }

  @Public()
  @Post('login')
  async loginUser(@Body() body: LoginDTO): Promise<SuccessResponse> {
    return this.service.loginUser(body, ENUM_USER_TYPES.USER);
  }

  @Public()
  @Post('register')
  async registerUser(@Body() body: RegisterDTO): Promise<SuccessResponse> {
    return this.service.registerUser({ ...body, userType: ENUM_USER_TYPES.USER });
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(@Body() body: RefreshTokenDTO): Promise<SuccessResponse<ILginResponse>> {
    return this.service.refreshToken(body);
  }

  @Public()
  @Post('otp-send')
  async sendB2bUserOtp(@Body() body: SendOtpDTO): Promise<SuccessResponse> {
    return this.service.sendOtp(body);
  }

  @Public()
  @Post('otp-verify')
  async verifyOtp(@Body() body: VerifyOtpDTO): Promise<SuccessResponse<ILginResponse>> {
    return this.service.verifyOtp(body);
  }

  @Public()
  @Post('reset-password-request')
  async resetPassword(@Body() body: ResetPasswordDTO): Promise<SuccessResponse> {
    return this.service.resetPassword(body);
  }

  @Public()
  @Post('reset-password-verify')
  async verifyPassword(
    @Body() body: VerifyResetPasswordDTO,
  ): Promise<SuccessResponse<ILginResponse>> {
    return this.service.verifyResetPassword(body);
  }

  @Patch('change-password')
  async changePassword(
    @Body() body: ChangePasswordDTO,
    @AuthUser() authUser: IAuthUser,
  ): Promise<SuccessResponse<ILginResponse>> {
    return this.service.changePassword(body, authUser);
  }
}
