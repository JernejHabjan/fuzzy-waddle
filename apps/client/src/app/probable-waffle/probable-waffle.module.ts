import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProbableWaffleRoutingModule } from './probable-waffle-routing.module';
import { ProbableWaffleSkirmishComponent } from './probable-waffle-skirmish/probable-waffle-skirmish.component';
import { ProbableWaffleHomeComponent } from './probable-waffle-home/probable-waffle-home.component';
import { ProbableWaffleComponent } from './probable-waffle.component';
import { ConstellationEffectComponent } from './probable-waffle-home/constellation-effect/constellation-effect.component';
import { ProbableWaffleProfileComponent } from './probable-waffle-profile/probable-waffle-profile.component';
import { ProbableWaffleMapDefinitionComponent } from './probable-waffle-skirmish/probable-waffle-map-definition/probable-waffle-map-definition.component';
import { FormsModule } from '@angular/forms';
import { ProbableWafflePlayerDefinitionComponent } from './probable-waffle-skirmish/probable-waffle-player-definition/probable-waffle-player-definition.component';
import { ProbableWaffleGameModeDefinitionComponent } from './probable-waffle-skirmish/probable-waffle-game-mode-definition/probable-waffle-game-mode-definition.component';
import { ProbableWaffleMapSelectorComponent } from './probable-waffle-skirmish/probable-waffle-map-selector/probable-waffle-map-selector.component';

@NgModule({
  declarations: [
    ProbableWaffleSkirmishComponent,
    ProbableWaffleHomeComponent,
    ProbableWaffleComponent,
    ConstellationEffectComponent,
    ProbableWaffleProfileComponent,
    ProbableWaffleMapDefinitionComponent,
    ProbableWafflePlayerDefinitionComponent,
    ProbableWaffleGameModeDefinitionComponent,
    ProbableWaffleMapSelectorComponent
  ],
  imports: [CommonModule, ProbableWaffleRoutingModule, FormsModule]
})
export class ProbableWaffleModule {}
