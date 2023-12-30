import { NgModule } from "@angular/core";
import { LobbyComponent } from "./lobby.component";
import { FormsModule } from "@angular/forms";
import { PlayerDefinitionComponent } from "./player-definition/player-definition.component";
import { MapSelectorComponent } from "./map-selector/map-selector.component";
import { MapDefinitionComponent } from "./map-definition/map-definition.component";
import { GameModeDefinitionComponent } from "./game-mode-definition/game-mode-definition.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CommonModule } from "@angular/common";
import { ComponentsModule } from "../../../shared/components/components.module";
import { RouterLink } from "@angular/router";
import { TriggerComponent } from "./trigger/trigger.component";
import { SpectatorsGridComponent } from "./spectators-grid/spectators-grid.component";
import { ChatComponent } from "../../../shared/components/chat/chat.component";
import { LobbyChatComponent } from "./lobby-chat/lobby-chat.component";

@NgModule({
  declarations: [
    LobbyComponent,
    PlayerDefinitionComponent,
    MapSelectorComponent,
    MapDefinitionComponent,
    GameModeDefinitionComponent,
    TriggerComponent
  ],
  exports: [LobbyComponent, MapSelectorComponent],
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    ComponentsModule,
    RouterLink,
    SpectatorsGridComponent,
    ChatComponent,
    LobbyChatComponent
  ]
})
export class LobbyModule {}
