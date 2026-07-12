import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from '@src/app/base/base.service';
import { IFindBaseOptions } from '@src/app/interfaces';
import { SuccessResponse } from '@src/app/types';
import { Repository } from 'typeorm';
import { SmsGatewayCreateDTO } from '../dtos/smsGateway/create.dto';
import { SmsGatewayParsedDataGetDTO } from '../dtos/smsGateway/gatewayParsedDataGet.dto';
import { SmsGatewayUpdateDTO } from '../dtos/smsGateway/update.dto';
import { SmsGateway } from '../entities/smsGateway.entity';
import { ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE } from '../enums';

@Injectable()
export class SmsGatewayService extends BaseService<SmsGateway> {
  constructor(
    @InjectRepository(SmsGateway)
    public readonly repo: Repository<SmsGateway>,
  ) {
    super(repo);
  }

  async createOne(
    payload: SmsGatewayCreateDTO,
    options: IFindBaseOptions<SmsGateway>,
  ): Promise<SmsGateway> {
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
    payload: SmsGatewayUpdateDTO,
    options: IFindBaseOptions<SmsGateway>,
  ): Promise<SmsGateway> {
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

  async getSmsGatewayParsedData(data: SmsGatewayParsedDataGetDTO): Promise<SmsGateway> {
    const whereCond: {
      accountType: ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE;
      userId?: string;
    } = {
      accountType: data.accountType,
    };

    if (data.userId) {
      whereCond.userId = data.userId;
    }

    const isExist = await this.findOne({
      where: whereCond,
    });

    if (!isExist) {
      throw new BadRequestException('Gateway not found');
    }

    return this.buildDataWithActualValues(isExist, {
      recipient: data.recipient,
      message: data.message,
    });
  }

  buildDataWithActualValues(
    smsGateway: SmsGateway,
    payload: {
      recipient: string;
      message: string;
    },
  ): SmsGateway {
    const { recipient, message } = payload;

    const smsId = `${recipient}-${Math.floor(1000 + Math.random() * 9000)}`;

    smsGateway.requestEndpoint = smsGateway.requestEndpoint
      .replace('{{recipient}}', recipient)
      .replace('{{message}}', message)
      .replace('{{smsId}}', smsId);
    smsGateway.requestEndpoint = encodeURI(smsGateway.requestEndpoint);
    if (smsGateway.requestBody) {
      if (smsGateway.requestBody.message) {
        smsGateway.requestBody.message = smsGateway.requestBody.message.replace(
          '{{message}}',
          message,
        );
      }
      if (smsGateway.requestBody.recipient) {
        smsGateway.requestBody.recipient = smsGateway.requestBody.recipient.replace(
          '{{recipient}}',
          recipient,
        );
      }
      if (smsGateway.requestBody.smsId) {
        smsGateway.requestBody.smsId = smsGateway.requestBody.smsId.replace('{{smsId}}', smsId);
      }
    }

    return smsGateway;
  }
}
