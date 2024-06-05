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

  async setup(
    token: string,
    type: string,
    emailAccount: string,
    user: UserDocument,
  ) {
    if (type == 'graph') {
      try {
        await this.syncMailBoxes(token, emailAccount, user);
        await this.syncEmails(token, emailAccount, user);
        await this.registerWebhook(token, emailAccount);
      } catch (e) {
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
      this.syncEmailsImap(emailAccount, user, imapConfig);
      this.listenImap(emailAccount, user, imapConfig);
    }
  }

  async sync(token: string, user: UserDocument): Promise<number | any> {
    // await this.setup(token, 'graph', 'mail@hotmail.com');
    await this.syncEmails(token, 'abdullahshahidabbasi@hotmail.com', user);
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

            this.eventsGateway.sendEvent('fetched', {
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

          this.eventsGateway.sendEvent('created', {
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

          this.eventsGateway.sendEvent('updated', {
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

      this.eventsGateway.sendEvent('fetched', {
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
    try {
      const integration: any = await this.integrationModel.findOne({
        email: emailAccount,
      });
      const { accessToken, userId } = integration.accessToken;

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

        this.eventsGateway.sendEvent('updated', {
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

        this.eventsGateway.sendEvent('created', {
          value: resourceId,
        });
      } else if (changeType == 'deleted') {
        await this.delete(resourceId);

        this.eventsGateway.sendEvent('deleted', {
          value: resourceId,
        });
      }
    } catch (error) {
      console.log(error.message);
    }
  }

  private async registerWebhook(token: string, emailAccount: string) {
    try {
      return await this.outlookService.registerWebhook(token, emailAccount);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
