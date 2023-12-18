import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";

@Injectable({
  providedIn: "root"
})
export class LevelGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const level = true; // todo read this from service instead from route
    if (level) {
      // Level exists, allow navigation
      return true;
    } else {
      // Level doesn't exist, redirect to a fallback route or show an error page
      this.router.navigate(["/probable-waffle"]);
      return false;
    }
  }
}
