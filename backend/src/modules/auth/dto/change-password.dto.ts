import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(8, { message: '新密码长度至少8位' })
  @MaxLength(50)
  newPassword: string;
}
