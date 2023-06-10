import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlySquasherRoutingModule } from './fly-squasher-routing.module';
import { FlySquasherComponent } from './fly-squasher.component';
import { MainModule } from './main/main.module';

@NgModule({
  declarations: [FlySquasherComponent],
  imports: [CommonModule, FlySquasherRoutingModule, MainModule]
})
export class FlySquasherModule {}
