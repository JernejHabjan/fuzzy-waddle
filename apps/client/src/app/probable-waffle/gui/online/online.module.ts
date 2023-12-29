import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { OnlineComponent } from "./online.component";
import { LobbiesComponent } from "./lobbies/lobbies.component";
import { HostComponent } from "./host/host.component";
import { MatchmakingComponent } from "./matchmaking/matchmaking.component";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { FormsModule } from "@angular/forms";
import { ComponentsModule } from "../../../shared/components/components.module";
import { MapFilterComponent } from "./lobbies/map-filter/map-filter.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { LobbyModule } from "../lobby/lobby.module";

@NgModule({
  declarations: [OnlineComponent, LobbiesComponent, HostComponent, MatchmakingComponent],
  imports: [CommonModule, LobbyModule, NgbModule, FormsModule, ComponentsModule, MapFilterComponent, FaIconComponent]
})
export class OnlineModule {}
