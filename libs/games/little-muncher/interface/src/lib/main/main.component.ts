import { Component, inject } from "@angular/core";
import type { OnInit } from "@angular/core";
import { littleMuncherGameConfig } from "@fuzzy-waddle/little-muncher-gameplay/const/game-config";
import { type LittleMuncherGameData } from "@fuzzy-waddle/little-muncher-gameplay/little-muncher-game-data";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { LittleMuncherUserInfo } from "@fuzzy-waddle/little-muncher-protocol";
import { LittleMuncherCommunicatorService } from "./communicators/little-muncher-communicator.service";
import { GameInstanceClientService } from "./communicators/game-instance-client.service";

import { GameContainerComponent } from "@fuzzy-waddle/platform-game-host/game-container/game-container.component";
import { GameInterfaceComponent } from "./game-interface/game-interface.component";
import { AngularHost } from "@fuzzy-waddle/platform-game-host/angular/consts";

@Component({
  selector: "little-muncher-main",
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.scss"],
  imports: [GameContainerComponent, GameInterfaceComponent],
  host: AngularHost.contentFlexFullHeight
})
export class MainComponent implements OnInit {
  protected readonly littleMuncherGameConfig = littleMuncherGameConfig;
  protected gameData?: LittleMuncherGameData;

  protected readonly communicator = inject(LittleMuncherCommunicatorService);
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);
  protected readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.gameData = {
      communicator: this.communicator,
      components: [],
      gameInstance: this.gameInstanceClientService.gameInstance!,
      user: new LittleMuncherUserInfo(this.authService.userId)
    };
  }
}
