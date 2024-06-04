import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IntegrationDocument = HydratedDocument<Integration>;

@Schema({ timestamps: true })
export class Integration {
  @Prop({ unique: true })
  email: string;

  @Prop()
  userId: string;

  @Prop()
  accessToken: string;

  @Prop()
  type: string;

  @Prop()
  provider: string;
}

export const IntegrationSchema = SchemaFactory.createForClass(Integration);
