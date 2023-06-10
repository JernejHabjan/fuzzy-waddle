import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FlySquasherComponent } from './fly-squasher.component';

const routes: Routes = [
  {
    path: '',
    component: FlySquasherComponent
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FlySquasherRoutingModule {}
