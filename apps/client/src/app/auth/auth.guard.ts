import { inject, Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { AuthService } from "./auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async canActivate(): Promise<boolean> {
    if (this.authService.processing) {
      await this.authService.processing;
    }
    const isAuthenticated = this.authService.isAuthenticated;
    if (!isAuthenticated) {
      await this.router.navigate(["/"]);
    }
    return isAuthenticated;
  }
}
