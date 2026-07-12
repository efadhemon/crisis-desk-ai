import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { SmsNotification } from '../entities/smsNotification.entity';
import { ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE, ENUM_SMS_GATEWAY_REQUEST_METHOD } from '../enums';
import { ISendSmsResponse, ISmsOption } from '../interfaces';
import { SmsGatewayService } from './smsGateway.service';

@Injectable()
export class SmsNotificationService {
  constructor(
    @InjectRepository(SmsNotification)
    private readonly repo: Repository<SmsNotification>,

    private readonly http: HttpService,
    private readonly smsGatewayService: SmsGatewayService,
  ) {}

  // Create a SMS notification
  async createNotification(payload: SmsNotification): Promise<SmsNotification> {
    const data = await this.repo.save(payload);
    return data;
  }

  // this method is called by the SMS queue processor
  async fireNotification(smsNotificationId: string): Promise<void> {
    const data = await this.repo.findOne({
      where: { id: smsNotificationId },
    });

    if (!data) {
      console.error(`SmsNotification with id ${smsNotificationId} not found.`);
      return;
    }
    if (data.isSuccess) {
      console.info(
        `SmsNotification with id ${smsNotificationId} has already been sent successfully.`,
      );
      return;
    }

    const res = await this.sendSmsThroughDefaultGateway({
      recipient: data.recipient,
      message: data.body,
    });
    console.info('🚀 ~ SmsNotificationService ~ fireNotification ~ res:', res);

    if (res?.success) {
      await this.repo.update(data.id, {
        isSuccess: true,
        gatewayResponse: res.data,
      } satisfies SmsNotification);
    }
  }

  private async sendSmsThroughDefaultGateway(payload: ISmsOption): Promise<ISendSmsResponse> {
    console.info('========= SENDING SMS THROUGH DEFAULT GATEWAY =========');
    console.info(`========= TO : ${payload.recipient} =========`);
    console.info(`========= MESSAGE : ${payload.message} =========`);

    try {
      if (!payload?.recipient) {
        throw new Error('======== RECIPIENT NOT PROVIDED ========');
      }

      const defaultSmsGateway = await this.smsGatewayService.findOne({
        where: {
          accountType: ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE.DEFAULT,
          isActive: true,
        },
      });
      if (!defaultSmsGateway) {
        throw new Error('========= DEFAULT SMS GATEWAY NOT FOUND =========');
      }
      if (defaultSmsGateway.requestMethod === ENUM_SMS_GATEWAY_REQUEST_METHOD.GET) {
        const sanitizedSmsGateway = this.smsGatewayService.buildDataWithActualValues(
          defaultSmsGateway,
          payload,
        );

        console.info('========= CALLING SMS GATEWAY =========');
        const responseData = this.http.get(sanitizedSmsGateway.requestEndpoint);

        console.info('========= SMS GATEWAY RESPONDING =========');

        const response = await firstValueFrom(responseData);

        console.info('========= SMS GATEWAY RESPONDED =========');

        return {
          success: true,
          message: 'SMS sent successfully',
          data: response?.data,
        };
      } else {
        throw new Error('======== UNSUPPORTED REQUEST METHOD FOR DEFAULT SMS GATEWAY ========');
      }
    } catch (error) {
      console.error('======== ERROR FROM DEFAULT SMS GATEWAY ========', error);
      return {
        success: false,
        message: error?.message ?? 'Failed to send SMS',
        data: null,
      };
    }
  }
}
