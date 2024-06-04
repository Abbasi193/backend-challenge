import { forwardRef, Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { Email, EmailSchema } from './schemas/email.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { OutlookModule } from 'src/outlook/outlook.module';
import { MailBox, MailBoxSchema } from './schemas/mailBox.schema';
import { EventsModule } from 'src/events/events.module';
import { ImapModule } from 'src/imap/imap.module';
import {
  Integration,
  IntegrationSchema,
} from 'src/auth/schemas/integration.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Email.name, schema: EmailSchema },
      { name: MailBox.name, schema: MailBoxSchema },
      { name: Integration.name, schema: IntegrationSchema },
    ]),
    forwardRef(() => OutlookModule),
    EventsModule,
    ImapModule,
  ],
  controllers: [EmailsController],
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}
