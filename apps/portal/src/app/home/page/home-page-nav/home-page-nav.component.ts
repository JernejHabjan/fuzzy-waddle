import { Component, inject, type OnInit } from "@angular/core";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { HomeNavComponent } from "@fuzzy-waddle/platform-identity/client/home-nav/home-nav.component";
import { RouterLink } from "@angular/router";
import { AvatarProviderService } from "@fuzzy-waddle/platform-identity/client/avatar-provider/avatar-provider.service";
import { CurrentUserProfileService } from "@fuzzy-waddle/platform-identity/client/profile-data/current-user-profile.service";
import { getRoleIcon, getRoleLabel } from "@fuzzy-waddle/platform-identity/client/utils/app-role-presentation";
import type { CurrentUserProfileDto } from "@fuzzy-waddle/platform-identity";

@Component({
  selector: "fuzzy-waddle-home-page-nav",
  templateUrl: "./home-page-nav.component.html",
  styleUrls: ["./home-page-nav.component.scss"],
  imports: [FaIconComponent, HomeNavComponent, RouterLink]
})
export class HomePageNavComponent implements OnInit {
  protected readonly faGoogle = faGoogle;
  protected readonly getRoleIcon = getRoleIcon;
  protected readonly getRoleLabel = getRoleLabel;
  protected currentUserProfile: CurrentUserProfileDto | null = null;

  protected readonly authService = inject(AuthService);
  protected readonly avatarProviderService = inject(AvatarProviderService);
  protected readonly currentUserProfileService = inject(CurrentUserProfileService);

  async ngOnInit(): Promise<void> {
    if (!this.authService.isAuthenticated) {
      this.currentUserProfile = null;
      return;
    }

    this.currentUserProfile = await this.currentUserProfileService.getCurrentUserProfile();
  }
}
