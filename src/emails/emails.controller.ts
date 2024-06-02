import { Controller, Get, Headers } from '@nestjs/common';
import { EmailsService } from './emails.service';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get()
  findAll(@Headers('authorization') token: string) {
    return this.emailsService.findAll(token.split(' ')[1]);
  }
}
