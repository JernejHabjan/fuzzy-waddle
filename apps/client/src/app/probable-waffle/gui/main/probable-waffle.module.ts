import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProbableWaffleRoutingModule } from './probable-waffle-routing.module';
import { SkirmishComponent } from '../skirmish/skirmish.component';
import { HomeComponent } from '../home/home.component';
import { ProbableWaffleComponent } from './probable-waffle.component';
import { ConstellationEffectComponent } from '../home/constellation-effect/constellation-effect.component';
import { ProfileComponent } from '../profile/profile.component';
import { MapDefinitionComponent } from '../skirmish/map-definition/map-definition.component';
import { FormsModule } from '@angular/forms';
import { PlayerDefinitionComponent } from '../skirmish/player-definition/player-definition.component';
import { GameModeDefinitionComponent } from '../skirmish/game-mode-definition/game-mode-definition.component';
import { MapSelectorComponent } from '../skirmish/map-selector/map-selector.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [
    SkirmishComponent,
    HomeComponent,
    ProbableWaffleComponent,
    ConstellationEffectComponent,
    ProfileComponent,
    MapDefinitionComponent,
    PlayerDefinitionComponent,
    GameModeDefinitionComponent,
    MapSelectorComponent
  ],
  imports: [CommonModule, ProbableWaffleRoutingModule, FormsModule, FontAwesomeModule]
})
export class ProbableWaffleModule {}
