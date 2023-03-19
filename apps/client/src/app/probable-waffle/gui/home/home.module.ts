import { NgModule } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home.component';
import { ConstellationEffectComponent } from './constellation-effect/constellation-effect.component';
import { ComponentsModule } from '../../../shared/components/components.module';
import { RouterLink } from '@angular/router';
import { HomePageNavComponent } from './home-page-nav/home-page-nav.component';

@NgModule({
  declarations: [HomeComponent, ConstellationEffectComponent, HomePageNavComponent],
  exports: [HomePageNavComponent],
  imports: [CommonModule, FontAwesomeModule, ComponentsModule, RouterLink]
})
export class HomeModule {}
