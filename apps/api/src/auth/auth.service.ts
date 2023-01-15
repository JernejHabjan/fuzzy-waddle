import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AuthService {
  private supabaseClient: SupabaseClient;

  constructor(private usersService: UsersService, private jwtService: JwtService) {
    this.supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  }

  async validateUserLocally(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async loginJwt(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload)
    };
  }

  async signInUser(dto: CreateUserDto) {
    const { user, session, error } = await this.supabaseClient.auth.signIn({
      email: dto.email,
      password: dto.password
    });

    return {
      user: user,
      session: session,
      error: error
    };
  }

  async signupUser(dto: CreateUserDto) {
    const { user, session, error } = await this.supabaseClient.auth.signUp(
      {
        email: dto.email,
        password: dto.password
      }
      /*,{
        data: {
          first_name: 'John',
          age: 27,
        }
      }*/
    );

    console.log(user);
    console.log(session);
    console.log(error);

    return {
      user: user,
      session: session,
      error: error
    };
  }
}
