import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProbableWaffleGameComponent } from './probable-waffle-game.component';
import { ProbableWaffleGameRoutingModule } from './probable-waffle-game-routing.module';
import { FormsModule } from '@angular/forms';
import { EditorDrawerComponent } from './gui/editor-drawer/editor-drawer.component';
import { TileSelectorComponent } from './gui/editor-drawer/tile-selector/tile-selector.component';
import { TileSelectorGroupComponent } from './gui/editor-drawer/tile-selector-group/tile-selector-group.component';
import { SelectionDisplayComponent } from './gui/selection-display/selection-display.component';

@NgModule({
  declarations: [
    ProbableWaffleGameComponent,
    EditorDrawerComponent,
    TileSelectorComponent,
    TileSelectorGroupComponent,
    SelectionDisplayComponent
  ],
  imports: [CommonModule, FormsModule, ProbableWaffleGameRoutingModule]
})
export class ProbableWaffleGameModule {}
