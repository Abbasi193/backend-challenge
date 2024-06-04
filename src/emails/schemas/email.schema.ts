import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EmailDocument = HydratedDocument<Email>;

@Schema({ timestamps: true })
export class Email {
  @Prop()
  subject: string;

  @Prop()
  body: string;

  @Prop()
  emailAccount: string;

  @Prop()
  senderEmail: string;

  @Prop()
  recipientEmails: string[];

  @Prop()
  isRead: boolean;

  @Prop()
  externalId: string;

  @Prop()
  mailBoxId: string;

  @Prop()
  date: string;
}

export const EmailSchema = SchemaFactory.createForClass(Email);
