import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProbableWaffleGameComponent } from './probable-waffle-game.component';

const routes: Routes = [
  {
    path: '',
    component: ProbableWaffleGameComponent,

  },
  { path: '**', redirectTo: '/' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProbableWaffleGameRoutingModule {}
