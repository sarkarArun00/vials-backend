import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from 'src/logistics/dto/login.dto';



@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

@Post('regenerate-password/:logisticsId')
regeneratePassword(
  @Param('logisticsId', ParseIntPipe) logisticsId: number,
) {
  return this.authService.regenerateLogisticsPassword(logisticsId);
}
}