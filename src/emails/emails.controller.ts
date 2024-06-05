import {
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EmailsService } from './emails.service';
import { Request } from 'express';
import { UserDecorator } from 'src/auth/jwt/user.decorator';
import { UserDocument } from 'src/auth/schemas/user.schema';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Headers('authorization') token: string,
    @UserDecorator() user: UserDocument,
  ) {
    return this.emailsService.sync(token.split(' ')[1], user);
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
