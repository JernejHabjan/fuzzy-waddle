// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy, AuthStrategies.jwt) {
//   constructor() {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       ignoreExpiration: false,
//       secretOrKey: jwtConstants.secret
//     });
//   }
//
//   async validate(payload: any) {
//     return { userId: payload.sub, username: payload.username };
//   }
// }
