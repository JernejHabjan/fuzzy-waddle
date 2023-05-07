import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameContainerComponent } from './game-container.component';

@NgModule({
  declarations: [GameContainerComponent],
  exports: [GameContainerComponent],
  imports: [CommonModule]
})
export class GameContainerModule {}
