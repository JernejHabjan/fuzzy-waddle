import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { LittleMuncherComponent } from "./little-muncher.component";

const routes: Routes = [
  {
    path: "",
    component: LittleMuncherComponent
  },
  { path: "**", redirectTo: "" }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LittleMuncherRoutingModule {}
