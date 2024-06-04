import { IsString } from 'class-validator';

export class SignUpDto {
  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  password: string;
}
