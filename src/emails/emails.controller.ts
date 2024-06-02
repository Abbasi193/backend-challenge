import { Controller, Get, Headers, HttpCode, Post, Req } from '@nestjs/common';
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
  @Post('notification')
  handleNotification(@Req() request: Request) {
    return this.emailsService.handleNotification(request);
  }
}
