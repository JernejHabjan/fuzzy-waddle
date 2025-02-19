import { Component } from "@angular/core";
import { MapDefinitionComponent } from "./map-definition/map-definition.component";
import { PlayerDefinitionComponent } from "./player-definition/player-definition.component";
import { SpectatorsGridComponent } from "./spectators-grid/spectators-grid.component";
import { GameModeDefinitionComponent } from "./game-mode-definition/game-mode-definition.component";
import { LobbyChatComponent } from "./lobby-chat/lobby-chat.component";

@Component({
  selector: "probable-waffle-lobby",
  templateUrl: "./lobby.component.html",
  styleUrls: ["./lobby.component.scss"],
  imports: [
    MapDefinitionComponent,
    PlayerDefinitionComponent,
    SpectatorsGridComponent,
    GameModeDefinitionComponent,
    LobbyChatComponent
  ]
})
export class LobbyComponent {}
