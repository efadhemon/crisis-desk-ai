import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalRequestInterceptor } from '@src/app/interceptors';
import { UuidValidationPipe } from '@src/app/pipes/uuidValidation.pipe';
import { SuccessResponse } from '@src/app/types';
import { FindOptionsRelations } from 'typeorm';
import { SmsGatewayCreateDTO } from '../../dtos/smsGateway/create.dto';
import { SmsGatewayFilterDTO } from '../../dtos/smsGateway/filter.dto';
import { SmsGatewayUpdateDTO } from '../../dtos/smsGateway/update.dto';
import { SmsGateway } from '../../entities/smsGateway.entity';
import { SmsGatewayService } from '../../services/smsGateway.service';

@ApiTags('Sms Gateway')
@ApiBearerAuth()
@ApiSecurity('X-Panel-Key')
@ApiSecurity('X-Api-Key')
@UseInterceptors(InternalRequestInterceptor)
@Controller(`internal/${SmsGateway.apiRouteName}`)
export class SmsGatewayInternalController {
  constructor(private readonly service: SmsGatewayService) {}

  RELATIONS: FindOptionsRelations<SmsGateway> = {};

  @Post()
  async create(@Body() body: SmsGatewayCreateDTO): Promise<SmsGateway> {
    return this.service.createOne(body, { relations: this.RELATIONS });
  }

  @Get()
  async findAll(@Query() query: SmsGatewayFilterDTO): Promise<SuccessResponse<SmsGateway[]>> {
    return this.service.findAllBase(query, { relations: this.RELATIONS });
  }

  @Get(':id')
  async findById(@Param('id', UuidValidationPipe) id: string): Promise<SmsGateway> {
    return this.service.findByIdBase(id, { relations: this.RELATIONS });
  }

  @Patch(':id')
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() body: SmsGatewayUpdateDTO,
  ): Promise<SmsGateway> {
    return this.service.updateOne(id, body, { relations: this.RELATIONS });
  }

  @Delete(':id')
  async delete(@Param('id', UuidValidationPipe) id: string): Promise<SuccessResponse> {
    return this.service.deleteOne(id);
  }
}
