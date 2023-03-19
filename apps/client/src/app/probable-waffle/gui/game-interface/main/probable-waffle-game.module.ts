import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProbableWaffleGameComponent } from './probable-waffle-game.component';
import { ProbableWaffleGameRoutingModule } from './probable-waffle-game-routing.module';
import { FormsModule } from '@angular/forms';
import { EditorDrawerComponent } from '../editor-drawer/editor-drawer.component';
import { TileSelectorComponent } from '../editor-drawer/tile-selector/tile-selector.component';
import { TileSelectorGroupComponent } from '../editor-drawer/tile-selector-group/tile-selector-group.component';
import { SelectionDisplayComponent } from '../selection/selection-display/selection-display.component';
import { AtlasDisplayComponent } from '../editor-drawer/atlas-display/atlas-display.component';
import { SelectionGroupComponent } from '../selection/selection-group/selection-group.component';
import { ComponentsModule } from '../../../../shared/components/components.module';

@NgModule({
  declarations: [
    ProbableWaffleGameComponent,
    EditorDrawerComponent,
    TileSelectorComponent,
    TileSelectorGroupComponent,
    SelectionDisplayComponent,
    AtlasDisplayComponent,
    SelectionGroupComponent
  ],
  imports: [CommonModule, FormsModule, ProbableWaffleGameRoutingModule, ComponentsModule]
})
export class ProbableWaffleGameModule {}
