import { Component, inject } from "@angular/core";
import { AuthService } from "../../../auth/auth.service";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { HomeNavComponent } from "../../../shared/components/home-nav/home-nav.component";
import { RouterLink } from "@angular/router";
import { AvatarProviderService } from "../../../shared/components/chat/avatar-provider/avatar-provider.service";

@Component({
  selector: "probable-waffle-home-page-nav",
  templateUrl: "./home-page-nav.component.html",
  styleUrls: ["./home-page-nav.component.scss"],
  imports: [FaIconComponent, HomeNavComponent, RouterLink]
})
export class HomePageNavComponent {
  protected readonly faGoogle = faGoogle;

  protected readonly authService = inject(AuthService);
  protected readonly avatarProviderService = inject(AvatarProviderService);
}
