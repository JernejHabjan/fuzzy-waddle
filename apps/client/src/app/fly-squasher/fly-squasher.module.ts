import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlySquasherRoutingModule } from './fly-squasher-routing.module';
import { FlySquasherComponent } from './fly-squasher.component';
import { MainModule } from './main/main.module';
import { ChooseLevelComponent } from './choose-level/choose-level.component';
import { HighScoreComponent } from './high-score/high-score.component';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [FlySquasherComponent, ChooseLevelComponent, HighScoreComponent, HomeComponent],
  imports: [CommonModule, FlySquasherRoutingModule, MainModule]
})
export class FlySquasherModule {}
