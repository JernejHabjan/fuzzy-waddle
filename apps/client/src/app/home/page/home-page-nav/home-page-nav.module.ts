import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomePageNavComponent } from './home-page-nav.component';
import { ComponentsModule } from '../../../shared/components/components.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';

@NgModule({
  declarations: [HomePageNavComponent],
  imports: [CommonModule, ComponentsModule, FontAwesomeModule, RouterLink],
  exports: [HomePageNavComponent]
})
export class HomePageNavModule {}
