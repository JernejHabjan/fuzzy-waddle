import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProbableWafflePlaygroundRoutingModule } from './probable-waffle-playground-routing.module';
import { ProbableWafflePlaygroundComponent } from './probable-waffle-playground.component';


@NgModule({
  declarations: [ProbableWafflePlaygroundComponent],
  imports: [
    CommonModule,
    ProbableWafflePlaygroundRoutingModule
  ]
})
export class ProbableWafflePlaygroundModule { }
