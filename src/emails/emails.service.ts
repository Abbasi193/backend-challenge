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
import Bottleneck from 'bottleneck';
import { Request } from 'express';
import { EventsGateway } from 'src/events/events.gateway';
import { ImapService } from 'src/imap/imap.service';
import { ImapSimpleOptions } from 'imap-simple';

const TOKEN = ''
// const Page_Size = 1000;
const Rate_Per_Minute = 1000;
const Max_Request = 10000;

const limiter = new Bottleneck({
  minTime: 1000 / (Rate_Per_Minute / 60),
  maxConcurrent: 4,
});
@Injectable()
export class EmailsService {
  constructor(
    @InjectModel(Email.name) private emailModel: Model<Email>,
    @InjectModel(MailBox.name) private mailBoxModel: Model<MailBox>,
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

  async setup(token: string, type: string) {
    const emailAccount = 'user@hotmail.com';
    if (type == 'graph') {
      // await this.syncMailBoxes(token, emailAccount);
      // await this.syncEmails(token, emailAccount);
      await this.registerWebhook(token, emailAccount);
    } else {
      const imapConfig: ImapSimpleOptions = {
        imap: {
          user: 'user@hotmail.com',
          password: 'password',
          // xoauth2: btoa(`user=${email}\x01auth=Bearer ${token}\x01\x01`),
          host: 'imap-mail.outlook.com',
          port: 993,
          tls: true,
          authTimeout: 3000,
        },
      };
      const mailBoxes = await this.imapService.getMailBoxInfo(imapConfig);
      await this.createMailBox(mailBoxes);
      this.syncImap(emailAccount, imapConfig);
      this.listenImap(emailAccount, imapConfig);
    }
  }

  async sync(token: string): Promise<number | any> {
    await this.setup(token, 'graph');

  }

  async syncImap(
    emailAccount: string,
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
              return { ...e, emailAccount, mailBoxId: mailBox._id.toString() };
            });
            await this.create(emails);
          },
        );
    });
  }

  async listenImap(
    emailAccount: string,
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
            { ...email, emailAccount, mailBoxId: mailBox._id.toString() },
          ]);
        },
        async (email) => {
          await this.update(email.externalId, email);
        },
      );
    });
  }

  async syncEmails(token: string, emailAccount: string): Promise<number> {
    return await this.run(async (index) => {
      let emails = await this.outlookService.findEmails(token, index);
      emails = emails.map((e) => {
        return { ...e, emailAccount };
      });
      await this.create(emails);
      return emails.length;
    });
  }

  async syncMailBoxes(token: string, emailAccount: string): Promise<number> {
    return await this.run(async (index) => {
      let mailBoxes = await this.outlookService.findMailBoxes(token, index);
      mailBoxes = mailBoxes.map((e) => {
        return { ...e, emailAccount };
      });
      await this.createMailBox(mailBoxes);
      return mailBoxes.length;
    });
  }

  async run(callback: (x: number) => Promise<number>): Promise<number> {
    let requestCount = 0;
    let itemCount = 0;
    let hasMoreItems = true;

    while (hasMoreItems && requestCount < Max_Request) {
      await limiter.schedule(async () => {
        const count = await callback(itemCount);
        itemCount += count;
        requestCount++;
        hasMoreItems = count > 0;
      });
    }

    return itemCount;
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
  async handleChange(
    resourceId: string,
    changeType: string,
    emailAccount: string,
  ) {
    try {
      if (changeType == 'updated') {
        const email = await this.outlookService.findEmail(TOKEN, resourceId);
        await this.update(resourceId, email);
      } else if (changeType == 'created') {
        const email = await this.outlookService.findEmail(TOKEN, resourceId);
        await this.create([{ ...email, emailAccount: emailAccount }]);
      } else if (changeType == 'deleted') {
        await this.delete(resourceId);
      }
    } catch (error) {
      console.log(error.message);
    }
  }

  async registerWebhook(token: string, emailAccount: string) {
    try {
      return await this.outlookService.registerWebhook(token, emailAccount);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
