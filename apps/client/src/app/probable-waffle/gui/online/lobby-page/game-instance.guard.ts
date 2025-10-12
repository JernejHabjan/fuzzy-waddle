import { inject, Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, type CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { environment } from "../../../../../environments/environment";
import { ServerHealthService } from "../../../../shared/services/server-health.service";

@Injectable({
  providedIn: "root"
})
export class GameInstanceGuard implements CanActivate {
  private readonly router = inject(Router);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly serverHealthService = inject(ServerHealthService);

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const gameInstance = this.gameInstanceClientService.gameInstance;
    if (gameInstance) {
      // Game Instance exists, allow navigation
      return true;
    } else {
      if (!environment.production) {
        await this.serverHealthService.checkHealth();
        if (this.serverHealthService.serverAvailable) {
          await this.router.navigate(["/aota/instant-game"]);
          // await this.router.navigate(["/aota/instant-network-match"]);
        } else {
          await this.router.navigate(["/aota/instant-game"]);
        }

        return false;
      } else {
        console.error("Game Instance doesn't exist in GameInstanceGuard");
        await this.router.navigate(["/aota"]);
        return false;
      }
    }
  }
}
