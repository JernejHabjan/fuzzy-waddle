import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './main.component';
import { GameInterfaceComponent } from './game-interface/game-interface.component';
import { ComponentsModule } from '../../shared/components/components.module';
import { GameContainerModule } from '../../shared/game/game-container/game-container.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [MainComponent, GameInterfaceComponent],
  exports: [MainComponent],
  imports: [CommonModule, ComponentsModule, GameContainerModule, FontAwesomeModule]
})
export class MainModule {}
