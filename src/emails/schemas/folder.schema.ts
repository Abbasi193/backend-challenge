import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FolderDocument = HydratedDocument<Folder>;

@Schema({ timestamps: true })
export class Folder {
  @Prop()
  displayName: string;

  @Prop()
  emailAccount: string;

  @Prop()
  unreadItemCount: number;

  @Prop()
  totalItemCount: number;

  @Prop()
  isHidden: boolean;

  @Prop()
  externalId: string;
}

export const FolderSchema = SchemaFactory.createForClass(Folder);
