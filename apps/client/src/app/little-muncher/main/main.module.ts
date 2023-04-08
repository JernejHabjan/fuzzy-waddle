import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './main.component';
import { GameInterfaceComponent } from './game-interface/game-interface.component';
import { ComponentsModule } from '../../shared/components/components.module';

@NgModule({
  declarations: [MainComponent, GameInterfaceComponent],
  exports: [MainComponent],
  imports: [CommonModule, ComponentsModule]
})
export class MainModule {}
