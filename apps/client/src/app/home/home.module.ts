import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { HomePageComponent } from "./page/home-page.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ProfileComponent } from "./profile/profile.component";
import { ChatComponent } from "./chat/chat/chat.component";
import { FormsModule } from "@angular/forms";
import { ChatFloatComponent } from "./chat/chat-float/chat-float.component";
import { ProfileNavComponent } from "./profile/profile-nav/profile-nav.component";
import { ComponentsModule } from "../shared/components/components.module";
import { HomePageNavModule } from "./page/home-page-nav/home-page-nav.module";

@NgModule({
  declarations: [HomePageComponent, ProfileComponent, ChatComponent, ChatFloatComponent, ProfileNavComponent],
  imports: [CommonModule, RouterModule, FontAwesomeModule, FormsModule, ComponentsModule, HomePageNavModule],
  exports: [HomePageComponent]
})
export class HomeModule {}
