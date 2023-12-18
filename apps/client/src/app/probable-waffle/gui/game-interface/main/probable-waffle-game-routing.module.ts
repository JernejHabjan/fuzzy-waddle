import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ProbableWaffleGameComponent } from "./probable-waffle-game.component";
import { LevelGuard } from "./level.guard";

const routes: Routes = [
  {
    path: "",
    component: ProbableWaffleGameComponent,
    canActivate: [LevelGuard]
  },
  { path: "**", redirectTo: "/probable-waffle" }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProbableWaffleGameRoutingModule {}
