import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MailBoxDocument = HydratedDocument<MailBox>;

@Schema({ timestamps: true })
export class MailBox {
  @Prop()
  displayName: string;

  @Prop()
  emailAccount: string;

  @Prop()
  userId: string;

  @Prop()
  unreadItemCount: number;

  @Prop()
  totalItemCount: number;

  @Prop()
  externalId: string;
}

export const MailBoxSchema = SchemaFactory.createForClass(MailBox);
