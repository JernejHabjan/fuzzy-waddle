import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HomePageComponent } from './page/home-page.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ProfileComponent } from './profile/profile.component';

@NgModule({
  declarations: [HomePageComponent, ProfileComponent],
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  exports: [HomePageComponent]
})
export class HomeModule {}
