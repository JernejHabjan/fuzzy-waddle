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
    const map = this.gameInstanceClientService.gameInstance?.gameMode?.data.map;
    if (map) {
      // Map exists, allow navigation
      return true;
    } else {
      console.error("Map doesn't exist in LevelGuard");
      this.router.navigate(["/probable-waffle"]);
      return false;
    }
  }
}
