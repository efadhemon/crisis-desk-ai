import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@src/app/decorators/publicRoute.decorator';
import { SkipKeyCheck } from '@src/app/decorators/skipKeyCheck.decorator';
import { SuccessResponse } from '@src/app/types';
import { AdminLoginDTO } from '../dtos/login.dto';
import { AdminAuthService, IAdminLoginResult } from '../services/admin-auth.service';

@ApiTags('Auth')
@Public()
@SkipKeyCheck()
@Controller('admin')
export class AdminAuthController {
  constructor(private readonly service: AdminAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login — returns a JWT for protected admin endpoints.' })
  login(@Body() body: AdminLoginDTO): SuccessResponse<IAdminLoginResult> {
    const result = this.service.login(body);
    return new SuccessResponse('Login successful', result);
  }
}
