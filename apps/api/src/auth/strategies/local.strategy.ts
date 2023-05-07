// @Injectable()
// export class LocalStrategy extends PassportStrategy(Strategy, AuthStrategies.local) {
//   constructor(private authService: AuthService) {
//     super();
//   }
//
//   async validate(username: string, password: string): Promise<any> {
//     const user = await this.authService.validateUserLocally(username, password);
//     if (!user) {
//       throw new UnauthorizedException();
//     }
//     return user;
//   }
// }
