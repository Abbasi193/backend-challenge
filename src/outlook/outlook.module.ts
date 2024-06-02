import { Module } from '@nestjs/common';
import { OutlookService } from './outlook.service';

@Module({
  exports: [OutlookService],
  providers: [OutlookService],
})
export class OutlookModule {}
