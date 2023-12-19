import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { ProbableWaffleGameComponent } from "./probable-waffle-game.component";
import { ProbableWaffleGameRoutingModule } from "./probable-waffle-game-routing.module";
import { FormsModule } from "@angular/forms";
import { TileSelectorGroupComponent } from "../game-interface/editor-drawer/tile-selector-group/tile-selector-group.component";
import { SelectionDisplayComponent } from "../game-interface/selection/selection-display/selection-display.component";
import { EditorDrawerComponent } from "../game-interface/editor-drawer/editor-drawer.component";
import { TileSelectorComponent } from "../game-interface/editor-drawer/tile-selector/tile-selector.component";
import { AtlasDisplayComponent } from "../game-interface/editor-drawer/atlas-display/atlas-display.component";
import { SelectionGroupComponent } from "../game-interface/selection/selection-group/selection-group.component";
import { ComponentsModule } from "../../../shared/components/components.module";
import { GameContainerModule } from "../../../shared/game/game-container/game-container.module";

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
  imports: [CommonModule, FormsModule, ProbableWaffleGameRoutingModule, ComponentsModule, GameContainerModule]
})
export class ProbableWaffleGameModule {}
