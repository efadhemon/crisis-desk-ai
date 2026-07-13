import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@src/app/decorators';
import { IAuthUser } from '@src/app/interfaces';
import { SuccessResponse } from '@src/app/types';
import { FindOptionsRelations } from 'typeorm';
import { UserCreateDTO } from '../dtos/user/create.dto';
import { UserFilterDTO } from '../dtos/user/filter.dto';
import { UserUpdateDTO } from '../dtos/user/update.dto';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';

@ApiTags('User')
@ApiBearerAuth()
@Controller(User.apiRouteName)
export class UserController {
  constructor(private readonly service: UserService) {}

  RELATIONS: FindOptionsRelations<User> = {};

  @Get()
  async findAll(@Query() query: UserFilterDTO): Promise<SuccessResponse<User[]>> {
    return this.service.findAllBase(query, { relations: this.RELATIONS });
  }

  @Get('me')
  async me(@AuthUser() authUser: IAuthUser): Promise<User> {
    return this.service.findByIdBase(authUser.id);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<User> {
    return this.service.findByIdBase(id, { relations: this.RELATIONS });
  }

  @Post()
  async createOne(@Body() body: UserCreateDTO): Promise<User> {
    return this.service.createUser(body, this.RELATIONS);
  }

  @Patch(':id')
  async updateOne(@Param('id') id: string, @Body() body: UserUpdateDTO): Promise<User> {
    return this.service.updateUser(id, body, this.RELATIONS);
  }
}
