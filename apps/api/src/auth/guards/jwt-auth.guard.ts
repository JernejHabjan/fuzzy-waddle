import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthStrategies } from '../strategies/auth-strategies';

@Injectable()
export class JwtAuthGuard extends AuthGuard(AuthStrategies.jwt) {}
