import { Controller, Get, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('url')
  getAuthURL() {
    return this.authService.getAuthURL();
  }

  @Post('token')
  getToken(@Body('code') code: string) {
    return this.authService.getToken(code);
  }
}
