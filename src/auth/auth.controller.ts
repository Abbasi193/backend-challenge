import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';

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

  @Post('signup')
  signup(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('/signin')
  sigIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('temp')
  temp() {
    console.log('ok');
  }
}
