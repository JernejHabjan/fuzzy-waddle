import { NgModule } from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { ProbableWaffleRoutingModule } from "./probable-waffle-routing.module";
import { ProbableWaffleComponent } from "./probable-waffle.component";
import { ProgressComponent } from "../progress/progress.component";
import { HomeModule } from "../home/home.module";
import { FormsModule } from "@angular/forms";
import { OnlineModule } from "../online/online.module";
import { CampaignComponent } from "../campaign/campaign.component";
import { OptionsComponent } from "../options/options.component";
import { ComponentsModule } from "../../../shared/components/components.module";
import { ComingSoonComponent } from "../coming-soon/coming-soon.component";
import { LobbyModule } from "../lobby/lobby.module";

@NgModule({
  declarations: [ProbableWaffleComponent, ProgressComponent, CampaignComponent, OptionsComponent, ComingSoonComponent],
  imports: [
    CommonModule,
    ProbableWaffleRoutingModule,
    LobbyModule,
    HomeModule,
    FormsModule,
    OnlineModule,
    ComponentsModule,
    NgOptimizedImage
  ]
})
export class ProbableWaffleModule {}
