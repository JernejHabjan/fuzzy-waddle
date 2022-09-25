import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LittleMuncherRoutingModule } from './little-muncher-routing.module';
import { LittleMuncherComponent } from './little-muncher.component';

@NgModule({
  declarations: [LittleMuncherComponent],
  imports: [CommonModule, LittleMuncherRoutingModule]
})
export class LittleMuncherModule {}
