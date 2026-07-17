import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticationService } from './authentication.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';

@ApiTags('authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AuthResponseDto })
  async register(@Body() dto: RegisterAuthDto): Promise<AuthResponseDto> {
    return this.authenticationService.register(dto);
  }
}
