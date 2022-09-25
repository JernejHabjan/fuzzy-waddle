import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProbableWafflePlaygroundComponent } from './probable-waffle-playground.component';

const routes: Routes = [
  {
    path:'',
    component:ProbableWafflePlaygroundComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProbableWafflePlaygroundRoutingModule { }
