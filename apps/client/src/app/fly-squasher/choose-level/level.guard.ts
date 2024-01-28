import { inject, Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { FlySquasherLevels } from "@fuzzy-waddle/api-interfaces";

@Injectable({
  providedIn: "root"
})
export class LevelGuard implements CanActivate {
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const levelId = route.paramMap.get("level"); // Get the level ID from the route parameter
    if (!levelId) return false; // If there is no level ID, don't allow navigation (this should never happen
    // check if not int
    const levelIdInt = parseInt(levelId);
    if (isNaN(levelIdInt)) return false;
    const level = Object.values(FlySquasherLevels).find((level) => level.id === levelIdInt);

    if (level) {
      // Level exists, allow navigation
      return true;
    } else {
      // Level doesn't exist, redirect to a fallback route or show an error page
      this.router.navigate(["/fly-squasher/choose-level"]);
      return false;
    }
  }
}
