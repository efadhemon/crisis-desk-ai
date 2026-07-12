import { Body, Controller, Get, Patch, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalRequestInterceptor } from '@src/app/interceptors';
import { FindOptionsRelations } from 'typeorm';
import { GlobalConfigUpdateDTO } from '../../dtos/globalConfig/update.dto';
import { GlobalConfig } from '../../entities/globalConfig.entity';
import { GlobalConfigService } from '../../services/globalConfig.service';

@ApiTags('GlobalConfig')
@ApiBearerAuth()
@ApiSecurity('X-Panel-Key')
@ApiSecurity('X-Api-Key')
@UseInterceptors(InternalRequestInterceptor)
@Controller(`internal/${GlobalConfig.apiRouteName}`)
export class GlobalConfigInternalController {
  constructor(private readonly service: GlobalConfigService) {}

  RELATIONS: FindOptionsRelations<GlobalConfig> = {};

  @Get()
  async find(): Promise<any> {
    return this.service.getConfig();
  }

  @Patch()
  async updateOne(@Body() body: GlobalConfigUpdateDTO): Promise<any> {
    return await this.service.update(body);
  }
}
