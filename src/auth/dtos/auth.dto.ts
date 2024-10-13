import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SignUpDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Enter vaild email' })
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  readonly password: string;
}

export class LoginDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Enter vaild email' })
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  readonly password: string;
}

export class ForgetPasswordDto {
  @IsEmail()
  readonly email: string;
}
