import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './home/page/home-page.component';

const routes: Routes = [
  {
    path: '',
    component: HomePageComponent
  },
  {
    path: 'little-muncher',
    loadChildren: () =>
      import('./little-muncher/little-muncher.module').then(
        (m) => m.LittleMuncherModule
      )
  },
  {
    path: 'probable-waffle',
    loadChildren: () =>
      import('./probable-waffle/gui/main/probable-waffle.module').then(
        (m) => m.ProbableWaffleModule
      )
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
