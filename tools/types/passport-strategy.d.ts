declare module "passport-strategy" {
  export default class Strategy {
    name: string;
    authenticate(req: any, options?: any): void;
    success(user: any, info?: any): void;
    fail(challenge: any, status?: number): void;
    redirect(url: string, status?: number): void;
    pass(): void;
    error(err: Error): void;
  }
}
