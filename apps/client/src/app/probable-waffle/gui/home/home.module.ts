import { NgModule } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home.component';
import { ConstellationEffectComponent } from './constellation-effect/constellation-effect.component';

@NgModule({
  declarations: [
    HomeComponent,
    ConstellationEffectComponent
  ],
  imports: [CommonModule, FontAwesomeModule]
})
export class HomeModule {}
