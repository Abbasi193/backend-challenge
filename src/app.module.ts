import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OutlookModule } from './outlook/outlook.module';
import { EmailsModule } from './emails/emails.module';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost/nest',
    ),
    OutlookModule,
    EmailsModule,
    AuthModule,
    EventsModule,
  ],
  // controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
