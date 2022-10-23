import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProbableWaffleGameComponent } from './probable-waffle-game.component';
import { ProbableWaffleGameRoutingModule } from './probable-waffle-game-routing.module';
import { FormsModule } from '@angular/forms';
import { EditorDrawerComponent } from './gui/editor-drawer/editor-drawer.component';
import { TileSelectorComponent } from './gui/editor-drawer/tile-selector/tile-selector.component';
import { TileSelectorGroupComponent } from './gui/editor-drawer/tile-selector-group/tile-selector-group.component';
import { SelectionDisplayComponent } from './gui/selection/selection-display/selection-display.component';
import { AtlasDisplayComponent } from './gui/editor-drawer/atlas-display/atlas-display.component';
import { SelectionGroupComponent } from './gui/selection/selection-group/selection-group.component';

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
  imports: [CommonModule, FormsModule, ProbableWaffleGameRoutingModule]
})
export class ProbableWaffleGameModule {}
