import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from '@src/app/base/base.service';
import { IFindBaseOptions } from '@src/app/interfaces';
import { Repository } from 'typeorm';
import { EmailGatewayCreateDTO } from '../dtos/emailGateway/create.dto';
import { EmailGateway } from '../entities/emailGateway.entity';
import { ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE } from '../enums';
import { EmailGatewayUpdateDTO } from '../dtos/emailGateway/update.dto';
import { SuccessResponse } from '@src/app/types';

@Injectable()
export class EmailGatewayService extends BaseService<EmailGateway> {
  constructor(
    @InjectRepository(EmailGateway)
    public readonly repo: Repository<EmailGateway>,
  ) {
    super(repo);
  }

  async createOne(
    payload: EmailGatewayCreateDTO,
    options?: IFindBaseOptions<EmailGateway>,
  ): Promise<EmailGateway> {
    if (
      payload.accountType === ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE.DEFAULT &&
      payload.isActive
    ) {
      await this.repo.update(
        { accountType: ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE.DEFAULT },
        { isActive: false },
      );
    }
    return this.createOneBase(payload, options);
  }

  async updateOne(
    id: string,
    payload: EmailGatewayUpdateDTO,
    options: IFindBaseOptions<EmailGateway>,
  ): Promise<EmailGateway> {
    const isExist = await this.findOne({ where: { id } });
    if (!isExist) {
      throw new BadRequestException('Gateway not found');
    }

    if (
      (payload.accountType === ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE.DEFAULT ||
        isExist.accountType === ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE.DEFAULT) &&
      payload.isActive
    ) {
      await this.repo.update(
        { accountType: ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE.DEFAULT },
        { isActive: false },
      );
    }
    return this.updateOneBase(id, payload, options);
  }

  async deleteOne(id: string): Promise<SuccessResponse> {
    const isExist = await this.findOne({ where: { id } });
    if (!isExist) {
      throw new BadRequestException('Gateway not found');
    }

    if (
      isExist.accountType === ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE.DEFAULT &&
      isExist.isActive
    ) {
      throw new BadRequestException('Cannot delete default gateway');
    }

    return this.deleteOneBase(id);
  }
}
