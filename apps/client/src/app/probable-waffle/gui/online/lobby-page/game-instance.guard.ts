import { Injectable, inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { environment } from "../../../../../environments/environment";

@Injectable({
  providedIn: "root"
})
export class GameInstanceGuard implements CanActivate {
  private readonly router = inject(Router);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const gameInstance = this.gameInstanceClientService.gameInstance;
    if (gameInstance) {
      // Game Instance exists, allow navigation
      return true;
    } else {
      if (!environment.production) {
        this.router.navigate(["/probable-waffle/instant-game"]);
        return false;
      } else {
        console.error("Game Instance doesn't exist in GameInstanceGuard");
        this.router.navigate(["/probable-waffle"]);
        return false;
      }
    }
  }
}
