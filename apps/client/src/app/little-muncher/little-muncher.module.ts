import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LittleMuncherRoutingModule } from './little-muncher-routing.module';
import { LittleMuncherComponent } from './little-muncher.component';
import { MainModule } from './main/main.module';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [LittleMuncherComponent, HomeComponent],
  imports: [CommonModule, LittleMuncherRoutingModule, MainModule]
})
export class LittleMuncherModule {}
