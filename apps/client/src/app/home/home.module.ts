import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HomePageComponent } from './page/home-page.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ProfileComponent } from './profile/profile.component';
import { ChatComponent } from './chat/chat/chat.component';
import { FormsModule } from '@angular/forms';
import { ChatFloatComponent } from './chat/chat-float/chat-float.component';

@NgModule({
  declarations: [HomePageComponent, ProfileComponent, ChatComponent, ChatFloatComponent],
  imports: [CommonModule, RouterModule, FontAwesomeModule, FormsModule],
  exports: [HomePageComponent]
})
export class HomeModule {}
