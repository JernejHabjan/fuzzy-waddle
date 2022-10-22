import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProbableWaffleLevelsComponent } from './probable-waffle-levels/probable-waffle-levels.component';
import { ProbableWaffleHomeComponent } from './probable-waffle-home/probable-waffle-home.component';
import { ProbableWaffleComponent } from './probable-waffle.component';

const routes: Routes = [
  {
    path: '',
    component: ProbableWaffleComponent,
    children: [
      {
        path: '',
        component: ProbableWaffleHomeComponent
      },
      {
        path: 'levels',
        component: ProbableWaffleLevelsComponent
      },
      {
        path: 'playground',
        loadChildren: () =>
          import('./probable-waffle-playground/probable-waffle-playground.module').then(
            (m) => m.ProbableWafflePlaygroundModule
          )
      },
      {
        path: 'game',
        loadChildren: () =>
          import('./probable-waffle-game/probable-waffle-game.module').then((m) => m.ProbableWaffleGameModule)
      }
    ]
  },
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProbableWaffleRoutingModule {}
