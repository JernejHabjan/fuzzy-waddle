import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { OnlineComponent } from "./online.component";
import { LobbiesComponent } from "./lobbies/lobbies.component";
import { HostComponent } from "./host/host.component";
import { RankedComponent } from "./ranked/ranked.component";
import { SkirmishModule } from "../skirmish/skirmish.module";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { FormsModule } from "@angular/forms";
import { ComponentsModule } from "../../../shared/components/components.module";
import { MapFilterComponent } from "./lobbies/map-filter/map-filter.component";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

@NgModule({
  declarations: [OnlineComponent, LobbiesComponent, HostComponent, RankedComponent],
  imports: [CommonModule, SkirmishModule, NgbModule, FormsModule, ComponentsModule, MapFilterComponent, FaIconComponent]
})
export class OnlineModule {}
