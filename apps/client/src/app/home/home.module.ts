import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HomePageComponent } from './page/home-page.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [HomePageComponent],
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  exports: [HomePageComponent]
})
export class HomeModule {}
