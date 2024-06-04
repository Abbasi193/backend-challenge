import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OutlookModule } from 'src/outlook/outlook.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { JwtStrategy } from './jwt/jwt.strategy';
import { Integration, IntegrationSchema } from './schemas/integration.schema';
import { EmailsModule } from 'src/emails/emails.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: Integration.name, schema: IntegrationSchema },
    ]),
    OutlookModule,
    EmailsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
