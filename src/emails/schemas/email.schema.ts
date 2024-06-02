import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EmailDocument = HydratedDocument<Email>;

@Schema()
export class Email {
  @Prop()
  title: string;

  @Prop()
  body: string;

  @Prop()
  sender: string;

  @Prop()
  recipient: string;
}

export const EmailSchema = SchemaFactory.createForClass(Email);
