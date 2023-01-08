import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProbableWaffleSkirmishComponent } from './probable-waffle-skirmish/probable-waffle-skirmish.component';
import { ProbableWaffleHomeComponent } from './probable-waffle-home/probable-waffle-home.component';
import { ProbableWaffleComponent } from './probable-waffle.component';
import { ProbableWaffleProfileComponent } from './probable-waffle-profile/probable-waffle-profile.component';

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
        path: 'skirmish',
        component: ProbableWaffleSkirmishComponent
      },
      {
        path: 'profile',
        component: ProbableWaffleProfileComponent
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
