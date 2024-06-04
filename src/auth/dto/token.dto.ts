import { IsString } from 'class-validator';
export class TokenDto {
  @IsString()
  code: string;

  @IsString()
  provider: string;

  @IsString()
  type: string;
}
