import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入有效的手机号' })
  phone?: string;

  @IsString()
  @MinLength(8, { message: '密码长度至少8位' })
  @MaxLength(50)
  password: string;

  @IsString()
  @MinLength(2, { message: '用户名至少2位' })
  @MaxLength(50)
  username: string;

  @IsOptional()
  @IsUUID()
  guestUserId?: string;
}
