import { IsString, IsOptional, IsEmail, Matches } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/)
  phone?: string;

  @IsString()
  password: string;
}
