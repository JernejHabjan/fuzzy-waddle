import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SkirmishComponent } from '../skirmish/skirmish.component';
import { HomeComponent } from '../home/home.component';
import { ProbableWaffleComponent } from './probable-waffle.component';
import { ProfileComponent } from '../profile/profile.component';

const routes: Routes = [
  {
    path: '',
    component: ProbableWaffleComponent,
    children: [
      {
        path: '',
        component: HomeComponent
      },
      {
        path: 'skirmish',
        component: SkirmishComponent
      },
      {
        path: 'profile',
        component: ProfileComponent
      },
      {
        path: 'playground',
        loadChildren: () =>
          import('../playground/playground.module').then(
            (m) => m.PlaygroundModule
          )
      },
      {
        path: 'game',
        loadChildren: () =>
          import('../game-interface/main/probable-waffle-game.module').then((m) => m.ProbableWaffleGameModule)
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
