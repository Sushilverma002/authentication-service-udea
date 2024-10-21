import { Controller, Get, Post, Put, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signUp')
  signUp(
    @Body() name: string,
    email: string,
    password: string,
  ): Promise<{ token: string }> {
    return this.authService.signUp(name, email, password);
  }

  @Post('/login')
  login(@Body() email: string, password: string): Promise<{ token: string }> {
    return this.authService.login(email, password);
  }

  @Post('forget-password')
  async forgetPassowrd(@Body() email: string) {
    return this.authService.forgetPassword(email);
  }

  @Put('reset-password')
  async resetPassword(@Body() token: string, password: string) {
    return this.authService.resetPassword(password, token);
  }
}
