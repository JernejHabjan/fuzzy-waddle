import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { ProbableWaffleGameComponent } from "./probable-waffle-game.component";
import { ProbableWaffleGameRoutingModule } from "./probable-waffle-game-routing.module";
import { FormsModule } from "@angular/forms";
import { ComponentsModule } from "../../../shared/components/components.module";
import { GameContainerModule } from "../../../shared/game/game-container/game-container.module";

@NgModule({
  declarations: [ProbableWaffleGameComponent],
  imports: [CommonModule, FormsModule, ProbableWaffleGameRoutingModule, ComponentsModule, GameContainerModule]
})
export class ProbableWaffleGameModule {}
