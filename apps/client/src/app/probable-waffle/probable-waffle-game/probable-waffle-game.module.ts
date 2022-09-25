import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProbableWaffleGameComponent } from './probable-waffle-game.component';
import { ProbableWaffleGameRoutingModule } from './probable-waffle-game-routing.module';

@NgModule({
  declarations: [
    ProbableWaffleGameComponent
  ],
  imports: [CommonModule, ProbableWaffleGameRoutingModule]
})
export class ProbableWaffleGameModule {}
