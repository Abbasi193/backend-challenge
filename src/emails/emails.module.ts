import { forwardRef, Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { Email, EmailSchema } from './schemas/email.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { OutlookModule } from 'src/outlook/outlook.module';
import { Folder, FolderSchema } from './schemas/folder.schema';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Email.name, schema: EmailSchema },
      { name: Folder.name, schema: FolderSchema },
    ]),
    forwardRef(() => OutlookModule),
    EventsModule,
  ],
  controllers: [EmailsController],
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}
