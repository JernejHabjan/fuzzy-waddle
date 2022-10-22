import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProbableWaffleRoutingModule } from './probable-waffle-routing.module';
import { ProbableWaffleLevelsComponent } from './probable-waffle-levels/probable-waffle-levels.component';
import { ProbableWaffleHomeComponent } from './probable-waffle-home/probable-waffle-home.component';
import { ProbableWaffleComponent } from './probable-waffle.component';

@NgModule({
  declarations: [ProbableWaffleLevelsComponent, ProbableWaffleHomeComponent, ProbableWaffleComponent],
  imports: [CommonModule, ProbableWaffleRoutingModule]
})
export class ProbableWaffleModule {}
