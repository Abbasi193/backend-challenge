import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OutlookService } from 'src/outlook/outlook.service';
import { SignInDto } from './dto/signin.dto';
import { User } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/signup.dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly outlookService: OutlookService,
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  getAuthURL(type: string) {
    return this.outlookService.getAuthURL(type);
  }

  async getToken(code: string, type: string) {
    return await this.outlookService.getToken(code, type);
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

  private createToken(user: HydratedDocument<User>): any {
    const payload = { email: user.email, sub: user._id };
    return {
      token: this.jwtService.sign(payload),
    };
  }
}
