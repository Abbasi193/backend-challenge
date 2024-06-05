import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OutlookService } from 'src/outlook/outlook.service';
import { SignInDto } from './dto/signin.dto';
import { User, UserDocument } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/signup.dto';
import * as argon2 from 'argon2';
import { Integration } from './schemas/integration.schema';
import { EmailsService } from 'src/emails/emails.service';
import { TokenDto } from './dto/token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly outlookService: OutlookService,
    private readonly emailService: EmailsService,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Integration.name)
    private integrationModel: Model<Integration>,
    private jwtService: JwtService,
  ) {}

  getAuthURL(type: string, provider: string) {
    return this.outlookService.getAuthURL(type);
  }

  async connectEmail(user: UserDocument, tokenDto: TokenDto) {
    const { access_token, email } = await this.outlookService.getToken(
      tokenDto.code,
      tokenDto.type,
    );

    await this.integrationModel.create({
      accessToken: access_token,
      email,
      userId: user.id,
      provider: tokenDto.provider,
      type: tokenDto.type,
    });

    this.emailService.setup(access_token, tokenDto.type, email, user).catch();
  }

  async signUp(signUpDto: SignUpDto): Promise<any> {
    const { email, password, name } = signUpDto;
    const hashedPassword = await argon2.hash(password);

    const newUser = await this.userModel.create({
      email,
      password: hashedPassword,
      name,
    });

    return this.createToken(newUser);
  }

  async signIn(signInDto: SignInDto): Promise<any> {
    const { email, password } = signInDto;
    const user = await this.userModel.findOne({ email });

    if (!user || !(await argon2.verify(user.password, password))) {
      throw new UnauthorizedException();
    }
    return this.createToken(user);
  }

  private createToken(user: UserDocument): any {
    const payload = { email: user.email, sub: user._id };
    return {
      token: this.jwtService.sign(payload),
    };
  }
}
