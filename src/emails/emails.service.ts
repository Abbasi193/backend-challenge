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

  async sync(token: string): Promise<number | any> {
    const emailAccount = 'a@s.com';
    this.listenImap(token, emailAccount);
    // const mailBoxData = await this.imapService.getMailBoxInfo();
    // mailBoxData.forEach((mailBox) => {
    //   // if(mailBox.count > 0)
    //   //     fetchPaginatedEmails(mailBox)
    //   this.imapService.startListening(mailBox, console.log, console.log);
    // });

    // return await this.outlookService.registerWebhook(token);

    // await this.outlookService.connect();
    // let x = await this.outlookService.fetchEmails();
    // console.log(x)

    // this.eventsGateway.sendEvent('sync', {
    //   value: 100,
    // });
    // await this.syncEmails(token);
    // await this.syncMailBoxes(token);
    // return 1;
  }
  async syncImapMailbox() {
    const mailBoxes = await this.imapService.getMailBoxInfo();
    await this.createMailBox(mailBoxes);
  }
  async syncImap(token: string, emailAccount: string): Promise<number> {
    const mailBoxData: HydratedDocument<MailBox>[] =
      await this.mailBoxModel.find();

    mailBoxData.forEach((mailBox) => {
      if (mailBox.totalItemCount > 0)
        this.imapService.fetchPaginatedEmails(mailBox, async (emails) => {
          emails = emails.map((e) => {
            return { ...e, emailAccount, mailBoxId: mailBox._id.toString() };
          });
          await this.create(emails);
        });
    });
    return 1;
  }

  async listenImap(token: string, emailAccount: string): Promise<number> {
    const mailBoxData: HydratedDocument<MailBox>[] =
      await this.mailBoxModel.find();

    mailBoxData.forEach((mailBox) => {
      this.imapService.startListening(
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
    return 1;
  }

  async syncEmails(token: string): Promise<number> {
    return await this.run(async (index) => {
      const emails = await this.outlookService.findEmails(token, index);
      await this.create(emails);
      return emails.length;
    });
  }

  async syncMailBoxes(token: string): Promise<number> {
    return await this.run(async (index) => {
      const mailBoxes = await this.outlookService.findMailBoxes(token, index);
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

  async handleNotification(req: Request) {
    try {
      return await this.outlookService.handleNotification(req);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
