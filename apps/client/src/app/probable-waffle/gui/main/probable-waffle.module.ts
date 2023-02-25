import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProbableWaffleRoutingModule } from './probable-waffle-routing.module';
import { ProbableWaffleComponent } from './probable-waffle.component';
import { ProgressComponent } from '../progress/progress.component';
import { SkirmishModule } from '../skirmish/skirmish.module';
import { HomeModule } from '../home/home.module';

@NgModule({
  declarations: [ProbableWaffleComponent, ProgressComponent],
  imports: [CommonModule, ProbableWaffleRoutingModule, SkirmishModule, HomeModule]
})
export class ProbableWaffleModule {}
