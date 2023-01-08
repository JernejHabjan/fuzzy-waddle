import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProbableWaffleRoutingModule } from './probable-waffle-routing.module';
import { ProbableWaffleSkirmishComponent } from './probable-waffle-skirmish/probable-waffle-skirmish.component';
import { ProbableWaffleHomeComponent } from './probable-waffle-home/probable-waffle-home.component';
import { ProbableWaffleComponent } from './probable-waffle.component';
import { ConstellationEffectComponent } from './probable-waffle-home/constellation-effect/constellation-effect.component';
import { ProbableWaffleProfileComponent } from './probable-waffle-profile/probable-waffle-profile.component';
import { ProbableWaffleMapDefinitionComponent } from './probable-waffle-skirmish/probable-waffle-map-definition/probable-waffle-map-definition.component';

@NgModule({
  declarations: [
    ProbableWaffleSkirmishComponent,
    ProbableWaffleHomeComponent,
    ProbableWaffleComponent,
    ConstellationEffectComponent,
    ProbableWaffleProfileComponent,
    ProbableWaffleMapDefinitionComponent
  ],
  imports: [CommonModule, ProbableWaffleRoutingModule]
})
export class ProbableWaffleModule {}
