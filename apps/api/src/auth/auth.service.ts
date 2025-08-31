import { Injectable } from "@nestjs/common";
import { type IAuthService } from "./auth.service.interface";

@Injectable()
export class AuthService implements IAuthService {
  async validateTest() {
    return true;
  }

  // async validateUserLocally(username: string, pass: string): Promise<any> {
  //   const user = await this.usersService.findOne(username);
  //   if (user && user.password === pass) {
  //     const { password, ...result } = user;
  //     return result;
  //   }
  //   return null;
  // }

  // async loginJwt(user: any) {
  //   const payload = { username: user.username, sub: user.userId };
  //   return {
  //     access_token: this.jwtService.sign(payload)
  //   };
  // }

  // async signInUser(dto: CreateUserDto) {
  //   const { data:{ user, session}, error } = await this.supabaseClient.auth.signInWithPassword({
  //     email: dto.email,
  //     password: dto.password
  //   });
  //
  //   return {
  //     user,
  //     session,
  //     error
  //   };
  // }

  // async signupUser(dto: CreateUserDto) {
  //   const {data:{ user, session},  error } = await this.supabaseClient.auth.signUp(
  //     {
  //       email: dto.email,
  //       password: dto.password
  //     }
  //     /*,{
  //       data: {
  //         first_name: 'John',
  //         age: 27,
  //       }
  //     }*/
  //   );
  //
  //   console.log(user);
  //   console.log(session);
  //   console.log(error);
  //
  //   return {
  //     user,
  //     session,
  //     error
  //   };
  // }
}
