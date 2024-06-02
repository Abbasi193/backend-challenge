import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Email } from './schemas/email.schema';
import { OutlookService } from '../outlook/outlook.service';

@Injectable()
export class EmailsService {
  constructor(
    @InjectModel(Email.name) private emailModel: Model<Email>,
    private readonly outlookService: OutlookService,
  ) {}

  async findAll(token: string): Promise<Email[] | any> {
    return await this.outlookService.findAll(token);

    // return this.emailModel.find().exec();
  }
}
