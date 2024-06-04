import {
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { EmailsService } from './emails.service';
import { Request } from 'express';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get()
  findAll(@Headers('authorization') token: string) {
    return this.emailsService.sync(token.split(' ')[1]);
  }

  @HttpCode(200)
  @Post('notification/:provider')
  handleNotification(
    @Req() request: Request,
    @Param('provider') provider: string,
    @Query('email') email: string,
  ) {
    return this.emailsService.handleNotification(request, provider, email);
  }
}
