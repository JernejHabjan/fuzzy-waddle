import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { MapDefinitionComponent } from "./map-definition/map-definition.component";
import { PlayerDefinitionComponent } from "./player-definition/player-definition.component";
import { SpectatorsGridComponent } from "./spectators-grid/spectators-grid.component";
import { GameModeDefinitionComponent } from "./game-mode-definition/game-mode-definition.component";
import { LobbyChatComponent } from "./lobby-chat/lobby-chat.component";
import { MapBrowserComponent } from "./map-browser/map-browser.component";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { ProbableWaffleGameInstanceType, ProbableWaffleMapEnum } from "@fuzzy-waddle/api-interfaces";
import { TriggerComponent } from "./trigger/trigger.component";

import { GameInstanceClientService } from "../../communicators/game-instance-client.service";

@Component({
  selector: "probable-waffle-lobby",
  templateUrl: "./lobby.component.html",
  styleUrls: ["./lobby.component.scss"],
  standalone: true,
  imports: [
    MapDefinitionComponent,
    PlayerDefinitionComponent,
    SpectatorsGridComponent,
    GameModeDefinitionComponent,
    LobbyChatComponent,
    MapBrowserComponent,
    FormsModule,
    TriggerComponent
  ]
})
export class LobbyComponent implements OnInit {
  protected mapSearchQuery = "";
  protected selectedMapId: ProbableWaffleMapEnum | null = null;
  protected showGameSetup = false;

  private router = inject(Router);
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    // Check if there's already a map selected in the game instance
    setTimeout(() => {
      const mapId = this.gameInstanceClientService.gameInstance?.gameMode?.data.map;
      if (mapId) {
        this.selectedMapId = mapId;
        this.cdr.detectChanges();
      }
    });
  }

  toggleGameSetup() {
    this.showGameSetup = !this.showGameSetup;
  }

  filterMaps() {
    // Pass the current search query to the map browser component
    // The actual filtering logic is handled in the map browser component
    // This method is called when the search input changes
    if (this.mapSearchQuery !== null && this.mapSearchQuery !== undefined) {
      // We could add debounce logic here if needed
    }
  }

  protected get isSelfHosted(): boolean {
    return (
      this.gameInstanceClientService.gameInstance?.gameInstanceMetadata?.data.type ===
      ProbableWaffleGameInstanceType.SelfHosted
    );
  }

  leaveLobby() {
    this.router.navigate(["probable-waffle"]);
  }

  deselectMap() {
    this.selectedMapId = null;
  }
}
