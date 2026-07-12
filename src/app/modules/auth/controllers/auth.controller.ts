import { Body, Controller, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@src/app/decorators';
import { Public } from '@src/app/decorators/publicRoute.decorator';
import { IAuthUser, ILginResponse } from '@src/app/interfaces';
import { ENUM_USER_TYPES } from '@src/app/modules/user/enums';
import { SuccessResponse } from '@src/app/types';
import { ChangePasswordDTO } from '../dtos/changePassword.dto';
import { LoginDTO } from '../dtos/login.dto';
import { RefreshTokenDTO } from '../dtos/refreshToken.dto';
import { ResetPasswordDTO } from '../dtos/resetPassword.dto';
import { SendOtpDTO } from '../dtos/sendOtp.dto';
import { VerifyOtpDTO } from '../dtos/verifyOtp.dto';
import { VerifyResetPasswordDTO } from '../dtos/verifyResetPassword.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@ApiBearerAuth()
@ApiSecurity('X-Panel-Key')
@ApiSecurity('X-Api-Key')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('login')
  async loginUser(@Body() body: LoginDTO): Promise<SuccessResponse> {
    return this.service.loginUser(body, ENUM_USER_TYPES.INTERNAL);
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
