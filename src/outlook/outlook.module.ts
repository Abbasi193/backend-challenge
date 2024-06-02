import { forwardRef, Module } from '@nestjs/common';
import { OutlookService } from './outlook.service';
import { EmailsModule } from 'src/emails/emails.module';

@Module({
  imports: [forwardRef(() => EmailsModule)],
  exports: [OutlookService],
  providers: [OutlookService],
})
export class OutlookModule {}
