import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { HighScoreComponent } from "./high-score/high-score.component";
import { MainComponent } from "./main/main.component";
import { ChooseLevelComponent } from "./choose-level/choose-level.component";
import { LevelGuard } from "./choose-level/level.guard";
import { OptionsComponent } from "./options/options.component";

const routes: Routes = [
  {
    path: "",
    component: HomeComponent
  },
  {
    path: "choose-level",
    component: ChooseLevelComponent
  },
  {
    path: "play/:level",
    component: MainComponent,
    canActivate: [LevelGuard]
  },
  {
    path: "high-score",
    component: HighScoreComponent
  },
  {
    path: "options",
    component: OptionsComponent
  },
  { path: "**", redirectTo: "" }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FlySquasherRoutingModule {}
