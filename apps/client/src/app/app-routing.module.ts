import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./home/home.module').then(
        (m) => m.HomeModule
      )
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
