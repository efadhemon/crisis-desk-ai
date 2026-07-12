import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SuccessResponse } from '@src/app/types';
import { FindOptionsRelations } from 'typeorm';
import { CreateApiKeyDTO, FilterApiKeyDTO, UpdateApiKeyDTO } from '../dtos';
import { ApiKey } from '../entities/apiKey.entity';
import { ApiKeyService } from '../services/apiKey.service';

@ApiTags('API KEY')
@ApiBearerAuth()
@ApiSecurity('X-Panel-Key')
@ApiSecurity('X-Api-Key')
@Controller(ApiKey.apiRouteName)
export class ApiKeyController {
  constructor(private readonly service: ApiKeyService) {}
  RELATIONS: FindOptionsRelations<ApiKey> = {};

  @Get()
  async findAll(@Query() query: FilterApiKeyDTO): Promise<SuccessResponse<ApiKey[]>> {
    return this.service.findAllBase(query, { relations: this.RELATIONS });
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ApiKey> {
    return this.service.findByIdBase(id, { relations: this.RELATIONS });
  }

  @Post()
  async createOne(@Body() body: CreateApiKeyDTO): Promise<ApiKey> {
    return this.service.createOneBase(body, { relations: this.RELATIONS });
  }

  @Patch(':id')
  async updateOne(@Param('id') id: string, @Body() body: UpdateApiKeyDTO): Promise<ApiKey> {
    return this.service.updateOneBase(id, body, { relations: this.RELATIONS });
  }

  @Delete(':id')
  async deleteOne(@Param('id') id: string): Promise<SuccessResponse> {
    return this.service.deleteOneBase(id);
  }
}
