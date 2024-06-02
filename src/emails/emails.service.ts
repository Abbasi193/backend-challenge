import { Model } from 'mongoose';
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
import { Folder } from './schemas/folder.schema';
import Bottleneck from 'bottleneck';
import { Request } from 'express';

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
    @InjectModel(Folder.name) private folderModel: Model<Folder>,
    @Inject(forwardRef(() => OutlookService))
    private readonly outlookService: OutlookService,
  ) {}

  async create(emails: Email[]): Promise<any> {
    return await this.emailModel.insertMany(emails);
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

  async createFolder(folders: Folder[]): Promise<any> {
    return await this.folderModel.insertMany(folders);
  }

  async sync(token: string): Promise<number> {
    await this.syncEmails(token);
    await this.syncFolders(token);
    return 1;
  }

  async syncEmails(token: string): Promise<number> {
    return await this.run(async (index) => {
      const emails = await this.outlookService.findEmails(token, index);
      await this.create(emails);
      return emails.length;
    });
  }

  async syncFolders(token: string): Promise<number> {
    return await this.run(async (index) => {
      const folders = await this.outlookService.findFolders(token, index);
      await this.createFolder(folders);
      return folders.length;
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
      await this.outlookService.handleNotification(req);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
