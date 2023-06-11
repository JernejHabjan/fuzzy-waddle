import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SkirmishComponent } from '../skirmish/skirmish.component';
import { HomeComponent } from '../home/home.component';
import { ProbableWaffleComponent } from './probable-waffle.component';
import { ProgressComponent } from '../progress/progress.component';
import { OptionsComponent } from '../options/options.component';
import { OnlineComponent } from '../online/online.component';
import { CampaignComponent } from '../campaign/campaign.component';
import { EditorComponent } from '../editor/editor.component';

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
        path: 'campaign',
        component: CampaignComponent
      },
      {
        path: 'online',
        component: OnlineComponent
      },
      {
        path: 'skirmish',
        component: SkirmishComponent
      },
      {
        path: 'editor',
        component: EditorComponent
      },
      {
        path: 'progress',
        component: ProgressComponent
      },
      {
        path: 'options',
        component: OptionsComponent
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
