import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailHelper } from '@src/app/helpers';
import { toBool, toNumber } from '@src/shared';
import * as nodemailer from 'nodemailer';
import { Repository } from 'typeorm';
import { EmailNotification } from '../entities/emailNotification.entity';
import { ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE } from '../enums';
import { IEmailOptions, ISendEmailResponse } from '../interfaces';
import { EmailGatewayService } from './emailGateway.service';

@Injectable()
export class EmailNotificationService {
  constructor(
    @InjectRepository(EmailNotification)
    public readonly repo: Repository<EmailNotification>,

    private readonly emailHelper: EmailHelper,
    private readonly emailGatewayService: EmailGatewayService,
  ) {}

  // Cached transporter to avoid creating a new SMTP connection per email
  private cachedTransporter: nodemailer.Transporter | null = null;
  private cachedSenderFrom: string | null = null;

  // Create an email notification
  async createNotification(payload: EmailNotification): Promise<EmailNotification> {
    const data = await this.repo.save(payload);
    return data;
  }

  // this method is called by the Email queue processor
  async fireNotification(emailNotificationId: string): Promise<void> {
    const data = await this.repo.findOne({
      where: { id: emailNotificationId },
    });

    if (!data) {
      console.error(`EmailNotification with id ${emailNotificationId} not found.`);
      return;
    }
    if (data.isSuccess) {
      console.info(
        `EmailNotification with id ${emailNotificationId} has already been sent successfully.`,
      );
      return;
    }

    const res = await this.sendEmailThroughDefaultGateway({
      to: data.recipient,
      subject: data.subject,
      html: data.body,
      attachments: data.attachments,
    });
    console.info('🚀 ~ EmailNotificationService ~ fireNotification ~ res:', res);

    if (res.success) {
      await this.repo.update(data.id, {
        isSuccess: true,
        gatewayResponse: res.data,
      } satisfies EmailNotification);
    }
  }

  /**
   * Get or create a reusable nodemailer transporter.
   * Returns both the transporter and the 'from' address.
   */
  private async getTransporter(): Promise<{
    transporter: nodemailer.Transporter;
    from: string;
  }> {
    if (this.cachedTransporter) {
      return { transporter: this.cachedTransporter, from: this.cachedSenderFrom };
    }

    const defaultEmailGateway = await this.emailGatewayService.findOne({
      where: {
        accountType: ENUM_NOTIFICATION_GATEWAY_ACCOUNT_TYPE.DEFAULT,
        isActive: true,
      },
    });

    if (!defaultEmailGateway) {
      throw new Error('========= DEFAULT EMAIL GATEWAY NOT FOUND =========');
    }

    this.cachedTransporter = nodemailer.createTransport({
      host: defaultEmailGateway.host,
      port: toNumber(defaultEmailGateway.port),
      secure: toBool(defaultEmailGateway.isSecure),
      auth: {
        user: defaultEmailGateway.authUser,
        pass: defaultEmailGateway.authPassword,
      },
      pool: true, // Enable SMTP connection pooling
      maxConnections: 5, // Limit concurrent SMTP connections
    });

    this.cachedSenderFrom = `${defaultEmailGateway?.senderLabel || 'Wage'} <${defaultEmailGateway.senderEmail}>`;

    return { transporter: this.cachedTransporter, from: this.cachedSenderFrom };
  }

  private async sendEmailThroughDefaultGateway(
    options: IEmailOptions,
  ): Promise<ISendEmailResponse> {
    console.info('========= SENDING EMAIL THROUGH DEFAULT GATEWAY =========');
    console.info(`========= TO : ${options.to} =========`);
    console.info(`========= Subject : ${options.subject} =========`);

    try {
      if (!options?.to) {
        throw new Error('======== RECIPIENT NOT PROVIDED ========');
      }

      const { transporter, from } = await this.getTransporter();

      const html = await this.emailHelper.createEmailContent(
        {
          body: options.html,
          copyRightYear: new Date().getFullYear(),
        },
        'email',
      );

      const sendMailPayload = {
        ...options,
        from,
        html: html,
      };

      const res = await transporter.sendMail(sendMailPayload);

      console.info('========= EMAIL GATEWAY RESPONDED =========');

      return {
        success: true,
        message: 'Email sent successfully',
        data: res.response,
      };
    } catch (error) {
      console.error(
        '🚀 ~ ~ EmailNotificationService ~ sendEmailThroughDefaultGateway ~ error:',
        error,
      );
      // Reset cached transporter on connection errors so next call creates a fresh one
      if (error?.code === 'ECONNECTION' || error?.code === 'EAUTH') {
        this.cachedTransporter = null;
        this.cachedSenderFrom = null;
      }
      return {
        success: false,
        message: error?.message ?? 'Failed to send email',
        data: null,
      };
    }
  }
}
