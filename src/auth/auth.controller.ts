import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('url')
  getAuthURL(@Query('type') type: string) {
    return this.authService.getAuthURL(type);
  }

  @Post('token')
  getToken(@Body('code') code: string, @Query('type') type: string) {
    return this.authService.getToken(code, type);
  }
}
