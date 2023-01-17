import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AuthStrategies } from './auth-strategies';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, AuthStrategies.local) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUserLocally(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
