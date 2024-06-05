import {
  Controller,
  Get,
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
  async findAll(
    @Query('emailAccount') emailAccount: string,
    @UserDecorator() user: UserDocument,
  ) {
    return await this.emailsService.findAll(emailAccount, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mailboxes')
  async findMailBoxes(
    @Query('emailAccount') emailAccount: string,
    @UserDecorator() user: UserDocument,
  ) {
    return await this.emailsService.findMailBoxes(emailAccount, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('integrations')
  async findIntegration(@UserDecorator() user: UserDocument) {
    return await this.emailsService.findIntegration(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @UserDecorator() user: UserDocument) {
    return await this.emailsService.find(id, user);
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
