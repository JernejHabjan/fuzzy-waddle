import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProbableWaffleGameComponent } from './probable-waffle-game.component';
import { ProbableWaffleGameRoutingModule } from './probable-waffle-game-routing.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [ProbableWaffleGameComponent],
  imports: [CommonModule, FormsModule, ProbableWaffleGameRoutingModule]
})
export class ProbableWaffleGameModule {}
