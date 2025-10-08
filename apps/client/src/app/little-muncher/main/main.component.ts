import { Component, inject } from "@angular/core";
import type { OnInit } from "@angular/core";
import { littleMuncherGameConfig } from "../game/const/game-config";
import { type LittleMuncherGameData } from "../game/little-muncher-game-data";
import { AuthService } from "../../auth/auth.service";
import { LittleMuncherUserInfo } from "@fuzzy-waddle/api-interfaces";
import { LittleMuncherCommunicatorService } from "./communicators/little-muncher-communicator.service";
import { GameInstanceClientService } from "./communicators/game-instance-client.service";

import { GameContainerComponent } from "../../shared/game/game-container/game-container.component";
import { GameInterfaceComponent } from "./game-interface/game-interface.component";
import { AngularHost } from "../../shared/consts";

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
