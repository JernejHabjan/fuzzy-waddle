import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LittleMuncherRoutingModule } from './little-muncher-routing.module';
import { LittleMuncherComponent } from './little-muncher.component';
import { MainModule } from './main/main.module';
import { HomeComponent } from './home/home.component';
import { SpectateComponent } from './home/spectate/spectate.component';
import { LoaderComponent } from '../shared/loader/loader.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [LittleMuncherComponent, HomeComponent, SpectateComponent],
  imports: [CommonModule, LittleMuncherRoutingModule, MainModule, LoaderComponent, FontAwesomeModule]
})
export class LittleMuncherModule {}
