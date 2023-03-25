import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomePageNavComponent } from './home-page-nav.component';
import { ComponentsModule } from '../../../shared/components/components.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [HomePageNavComponent],
  imports: [CommonModule, ComponentsModule, FontAwesomeModule],
  exports: [HomePageNavComponent]
})
export class HomePageNavModule {}
