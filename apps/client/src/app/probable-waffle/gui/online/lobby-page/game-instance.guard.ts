import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";

@Injectable({
  providedIn: "root"
})
export class GameInstanceGuard implements CanActivate {
  constructor(
    private readonly router: Router,
    private readonly gameInstanceClientService: GameInstanceClientService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const gameInstance = this.gameInstanceClientService.gameInstance;
    if (gameInstance) {
      // Game Instance exists, allow navigation
      return true;
    } else {
      console.error("Game Instance doesn't exist in GameInstanceGuard");
      this.router.navigate(["/probable-waffle"]);
      return false;
    }
  }
}
