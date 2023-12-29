import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { HomeComponent } from "../home/home.component";
import { ProbableWaffleComponent } from "./probable-waffle.component";
import { ProgressComponent } from "../progress/progress.component";
import { OptionsComponent } from "../options/options.component";
import { OnlineComponent } from "../online/online.component";
import { CampaignComponent } from "../campaign/campaign.component";
import { LobbyComponent } from "../lobby/lobby.component";

const routes: Routes = [
  {
    path: "",
    component: ProbableWaffleComponent,
    children: [
      {
        path: "",
        component: HomeComponent
      },
      {
        path: "campaign",
        component: CampaignComponent
      },
      {
        path: "online",
        component: OnlineComponent
      },
      {
        path: "skirmish",
        component: LobbyComponent // todo rename later
      },
      {
        path: "progress",
        component: ProgressComponent
      },
      {
        path: "options",
        component: OptionsComponent
      },
      {
        path: "game",
        loadChildren: () => import("../main/probable-waffle-game.module").then((m) => m.ProbableWaffleGameModule)
      }
    ]
  },
  { path: "**", redirectTo: "home" }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProbableWaffleRoutingModule {}
