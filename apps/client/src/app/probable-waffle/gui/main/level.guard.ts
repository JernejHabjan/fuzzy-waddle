import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";

@Injectable({
  providedIn: "root"
})
export class LevelGuard implements CanActivate {
  constructor(
    private readonly router: Router,
    private readonly gameInstanceClientService: GameInstanceClientService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const level = this.gameInstanceClientService.gameInstance?.gameMode?.data.level;
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
