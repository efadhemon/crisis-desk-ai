import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UuidValidationPipe } from '@src/app/pipes/uuidValidation.pipe';
import { SuccessResponse } from '@src/app/types';
import { FindOptionsRelations } from 'typeorm';
import { EmailGatewayCreateDTO } from '../dtos/emailGateway/create.dto';
import { EmailGatewayFilterDTO } from '../dtos/emailGateway/filter.dto';
import { EmailGatewayUpdateDTO } from '../dtos/emailGateway/update.dto';
import { EmailGateway } from '../entities/emailGateway.entity';
import { EmailGatewayService } from '../services/emailGateway.service';

@ApiTags('Email Gateway')
@ApiBearerAuth()
@ApiSecurity('X-Panel-Key')
@ApiSecurity('X-Api-Key')
@Controller(EmailGateway.apiRouteName)
export class EmailGatewayController {
  constructor(private readonly service: EmailGatewayService) {}

  RELATIONS: FindOptionsRelations<EmailGateway> = {};

  @Post()
  async create(@Body() body: EmailGatewayCreateDTO): Promise<EmailGateway> {
    return this.service.createOne(body, { relations: this.RELATIONS });
  }

  @Get()
  async findAll(@Query() query: EmailGatewayFilterDTO): Promise<SuccessResponse<EmailGateway[]>> {
    return this.service.findAllBase(query, { relations: this.RELATIONS });
  }

  @Get(':id')
  async findById(@Param('id', UuidValidationPipe) id: string): Promise<EmailGateway> {
    return this.service.findByIdBase(id, { relations: this.RELATIONS });
  }

  @Patch(':id')
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() body: EmailGatewayUpdateDTO,
  ): Promise<EmailGateway> {
    return this.service.updateOne(id, body, { relations: this.RELATIONS });
  }

  @Delete(':id')
  async delete(@Param('id', UuidValidationPipe) id: string): Promise<SuccessResponse> {
    return this.service.deleteOne(id);
  }
}
