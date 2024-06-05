import { HydratedDocument, Model } from 'mongoose';
import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Email } from './schemas/email.schema';
import { OutlookService } from '../outlook/outlook.service';
import { MailBox } from './schemas/mailBox.schema';
import { Request } from 'express';
import { EventsGateway } from 'src/events/events.gateway';
import { ImapService } from 'src/imap/imap.service';
import { ImapSimpleOptions } from 'imap-simple';
import { Integration } from 'src/auth/schemas/integration.schema';
import { runWithBottleneck } from 'src/common/utils/rate-limiter';
import { UserDocument } from 'src/auth/schemas/user.schema';

@Injectable()
export class EmailsService {
  constructor(
    @InjectModel(Email.name) private emailModel: Model<Email>,
    @InjectModel(MailBox.name) private mailBoxModel: Model<MailBox>,
    @InjectModel(Integration.name) private integrationModel: Model<Integration>,
    @Inject(forwardRef(() => OutlookService))
    private readonly outlookService: OutlookService,
    private readonly eventsGateway: EventsGateway,
    private readonly imapService: ImapService,
  ) {}

  async create(emails: Email[]): Promise<any> {
    return await this.emailModel.insertMany(emails);
  }

  async delete(id: string): Promise<any> {
    return await this.emailModel.deleteOne({ externalId: id });
  }

  async update(id: string, email: Email): Promise<Email> {
    const updatedEmail = await this.emailModel
      .findOneAndUpdate({ externalId: id }, email)
      .lean();
    if (!updatedEmail) {
      throw new NotFoundException();
    }
    return updatedEmail;
  }

  async createMailBox(mailBoxes: MailBox[]): Promise<any> {
    return await this.mailBoxModel.insertMany(mailBoxes);
  }

  async find(id: string, user: UserDocument): Promise<any> {
    const email = await this.emailModel.findOne({
      userId: user.id,
      externalId: id,
    });
    if (!email) {
      throw new NotFoundException();
    }
    return email;
  }

  async findAll(emailAccount: string, user: UserDocument): Promise<any> {
    return await this.emailModel.find({
      userId: user.id,
      emailAccount: emailAccount,
    });
  }

  async findMailBoxes(emailAccount: string, user: UserDocument): Promise<any> {
    return await this.mailBoxModel.find({
      userId: user.id,
      emailAccount: emailAccount,
    });
  }

  async findIntegration(user: UserDocument): Promise<any> {
    const integration = await this.integrationModel.findOne({
      userId: user.id,
    });
    if (!integration) {
      throw new NotFoundException();
    }
    return {
      email: integration.email,
      userId: integration.userId,
      type: integration.type,
      provider: integration.provider,
    };
  }

  async setup(
    token: string,
    type: string,
    emailAccount: string,
    user: UserDocument,
  ) {
    if (type == 'REST_API') {
      try {
        await this.syncMailBoxes(token, emailAccount, user);
        await this.syncEmails(token, emailAccount, user);
        await this.registerWebhook(token, emailAccount);
        this.eventsGateway.sendEvent('completed', user.id, {});
      } catch (e) {
        this.eventsGateway.sendEvent('failed', user.id, {});
        console.log(e.response.data);
      }
    } else {
      const imapConfig: ImapSimpleOptions = {
        imap: {
          user: emailAccount,
          password: '',
          xoauth2: btoa(`user=${emailAccount}\x01auth=Bearer ${token}\x01\x01`),
          host: this.outlookService.getImapHost(),
          port: 993,
          tls: true,
          authTimeout: 3000,
        },
      };
      await this.syncMailBoxesImap(emailAccount, user, imapConfig);
      this.syncEmailsImap(emailAccount, user, imapConfig)
        .then(() => {
          this.eventsGateway.sendEvent('completed', user.id, {});
        })
        .catch((error) => {
          this.eventsGateway.sendEvent('failed', user.id, {});
          console.log(error);
        });
      this.listenImap(emailAccount, user, imapConfig)
        .then(() => {})
        .catch((error) => {
          console.log(error);
        });
    }
  }

  private async syncMailBoxesImap(
    emailAccount: string,
    user: UserDocument,
    imapConfig: ImapSimpleOptions,
  ) {
    let mailBoxes = await this.imapService.getMailBoxInfo(imapConfig);

    mailBoxes = mailBoxes.map((e) => {
      return { ...e, emailAccount, userId: user.id };
    });

    await this.createMailBox(mailBoxes);
  }

  private async syncEmailsImap(
    emailAccount: string,
    user: UserDocument,
    imapConfig: ImapSimpleOptions,
  ): Promise<void> {
    const mailBoxData: HydratedDocument<MailBox>[] =
      await this.mailBoxModel.find();

    mailBoxData.forEach((mailBox) => {
      if (mailBox.totalItemCount > 0)
        this.imapService.fetchPaginatedEmails(
          imapConfig,
          mailBox,
          async (emails) => {
            emails = emails.map((e) => {
              return {
                ...e,
                emailAccount,
                mailBoxId: mailBox._id.toString(),
                userId: user.id,
              };
            });

            await this.create(emails);

            this.eventsGateway.sendEvent('fetched', user.id, {
              value: emails.length,
            });
          },
        );
    });
  }

  private async listenImap(
    emailAccount: string,
    user: UserDocument,
    imapConfig: ImapSimpleOptions,
  ): Promise<void> {
    const mailBoxData: HydratedDocument<MailBox>[] =
      await this.mailBoxModel.find();

    mailBoxData.forEach((mailBox) => {
      this.imapService.startListening(
        imapConfig,
        mailBox,
        async (email) => {
          await this.delete(email.externalId);

          await this.create([
            {
              ...email,
              emailAccount,
              mailBoxId: mailBox._id.toString(),
              userId: user.id,
            },
          ]);

          this.eventsGateway.sendEvent('created', user.id, {
            value: email.externalId,
          });
        },
        async (email) => {
          await this.update(email.externalId, {
            ...email,
            emailAccount,
            mailBoxId: mailBox._id.toString(),
            userId: user.id,
          });

          this.eventsGateway.sendEvent('updated', user.id, {
            value: email.externalId,
          });
        },
      );
    });
  }

  private async syncEmails(
    token: string,
    emailAccount: string,
    user: UserDocument,
  ): Promise<number> {
    return await runWithBottleneck(async (index) => {
      let emails = await this.outlookService.findEmails(token, index);

      emails = emails.map((e) => {
        return { ...e, emailAccount, userId: user.id };
      });

      await this.create(emails);

      this.eventsGateway.sendEvent('fetched', user.id, {
        value: emails.length,
      });
      return emails.length;
    });
  }

  private async syncMailBoxes(
    token: string,
    emailAccount: string,
    user: UserDocument,
  ): Promise<number> {
    return await runWithBottleneck(async (index) => {
      let mailBoxes = await this.outlookService.findMailBoxes(token, index);

      mailBoxes = mailBoxes.map((e) => {
        return { ...e, emailAccount, userId: user.id };
      });

      await this.createMailBox(mailBoxes);
      return mailBoxes.length;
    });
  }

  async handleNotification(
    req: Request,
    provider: string,
    emailAccount: string,
  ) {
    try {
      return await this.outlookService.handleNotification(
        req,
        async (resourceId, changeType) => {
          return await this.handleChange(resourceId, changeType, emailAccount);
        },
      );
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  private async handleChange(
    resourceId: string,
    changeType: string,
    emailAccount: string,
  ) {
    const integration: any = await this.integrationModel.findOne({
      email: emailAccount,
    });
    const { accessToken, userId } = integration;

    if (changeType == 'updated') {
      const email = await this.outlookService.findEmail(
        accessToken,
        resourceId,
      );

      await this.update(resourceId, {
        ...email,
        emailAccount: emailAccount,
        userId: userId,
      });

      this.eventsGateway.sendEvent('updated', userId, {
        value: resourceId,
      });
    } else if (changeType == 'created') {
      const email = await this.outlookService.findEmail(
        accessToken,
        resourceId,
      );

      await this.create([
        { ...email, emailAccount: emailAccount, userId: userId },
      ]);

      this.eventsGateway.sendEvent('created', userId, {
        value: resourceId,
      });
    } else if (changeType == 'deleted') {
      await this.delete(resourceId);

      this.eventsGateway.sendEvent('deleted', userId, {
        value: resourceId,
      });
    }
  }

  private async registerWebhook(token: string, emailAccount: string) {
    try {
      return await this.outlookService.registerWebhook(token, emailAccount);
    } catch (error) {
      console.log(error.message);
    }
  }
}
