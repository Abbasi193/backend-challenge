import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OutlookModule } from 'src/outlook/outlook.module';

@Module({
  imports: [OutlookModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
