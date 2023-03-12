import { NgModule } from '@angular/core';
import { SkirmishComponent } from './skirmish.component';
import { FormsModule } from '@angular/forms';
import { PlayerDefinitionComponent } from './player-definition/player-definition.component';
import { MapSelectorComponent } from './map-selector/map-selector.component';
import { MapDefinitionComponent } from './map-definition/map-definition.component';
import { GameModeDefinitionComponent } from './game-mode-definition/game-mode-definition.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { ComponentsModule } from '../../../shared/components/components.module';
import { RouterLink } from '@angular/router';

@NgModule({
  declarations: [
    SkirmishComponent,
    PlayerDefinitionComponent,
    MapSelectorComponent,
    MapDefinitionComponent,
    GameModeDefinitionComponent
  ],
  exports: [SkirmishComponent, MapSelectorComponent],
  imports: [CommonModule, FormsModule, FontAwesomeModule, ComponentsModule, RouterLink]
})
export class SkirmishModule {}
