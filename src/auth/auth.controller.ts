import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { UserDecorator } from './jwt/user.decorator';
import { UserDocument } from './schemas/user.schema';
import { TokenDto } from './dto/token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('url')
  getAuthURL(@Query('type') type: string, @Query('provider') provider: string) {
    return this.authService.getAuthURL(type, provider);
  }

  @UseGuards(JwtAuthGuard)
  @Post('connect')
  connectEmail(
    @UserDecorator() user: UserDocument,
    @Body() tokenDto: TokenDto,
  ) {
    return this.authService.connectEmail(user, tokenDto);
  }

  @Post('signup')
  signup(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('/signin')
  sigIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }
}
