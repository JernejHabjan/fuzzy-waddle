import { NgModule } from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { ProbableWaffleRoutingModule } from "./probable-waffle-routing.module";
import { ProbableWaffleComponent } from "./probable-waffle.component";
import { ProgressComponent } from "../progress/progress.component";
import { SkirmishModule } from "../skirmish/skirmish.module";
import { HomeModule } from "../home/home.module";
import { FormsModule } from "@angular/forms";
import { OnlineModule } from "../online/online.module";
import { CampaignComponent } from "../campaign/campaign.component";
import { OptionsComponent } from "../options/options.component";
import { ComponentsModule } from "../../../shared/components/components.module";
import { ProbableWaffleComingSoonComponent } from "../probable-waffle-coming-soon/probable-waffle-coming-soon.component";

@NgModule({
  declarations: [
    ProbableWaffleComponent,
    ProgressComponent,
    CampaignComponent,
    OptionsComponent,
    ProbableWaffleComingSoonComponent
  ],
  imports: [
    CommonModule,
    ProbableWaffleRoutingModule,
    SkirmishModule,
    HomeModule,
    FormsModule,
    SkirmishModule,
    OnlineModule,
    ComponentsModule,
    NgOptimizedImage
  ]
})
export class ProbableWaffleModule {}
