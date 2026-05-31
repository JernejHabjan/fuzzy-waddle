import { ChangeDetectionStrategy, Component, inject, type OnInit } from "@angular/core";
import { AuthService } from "../../auth/auth.service";
import { UserInstanceService } from "./user-instance.service";
import { DatePipe } from "@angular/common";
import { ProfileNavComponent } from "./profile-nav/profile-nav.component";
import { AngularHost } from "../../shared/consts";
import { CurrentUserProfileService } from "../../data-access/profile/current-user-profile.service";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { getRoleIcon, getRoleLabel } from "../../shared/utils/app-role-presentation";
import type { CurrentUserProfileDto } from "@fuzzy-waddle/api-interfaces";
import { AvatarProviderService } from "../../shared/components/chat/avatar-provider/avatar-provider.service";

@Component({
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProfileNavComponent, DatePipe, FaIconComponent],
  host: AngularHost.contentFlexFullHeight
})
export class ProfileComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly userInstanceService = inject(UserInstanceService);
  protected readonly currentUserProfileService = inject(CurrentUserProfileService);
  protected readonly avatarProviderService = inject(AvatarProviderService);
  protected readonly getRoleIcon = getRoleIcon;
  protected readonly getRoleLabel = getRoleLabel;
  protected currentUserProfile: CurrentUserProfileDto | null = null;

  protected get profileAvatarUrl(): string {
    return this.avatarProviderService.getAvatar(this.authService.userId ?? this.profileDisplayName);
  }

  protected get profileDisplayName(): string {
    return (
      this.currentUserProfile?.displayName ??
      this.googleIdentityData?.full_name ??
      this.authService.fullName ??
      this.authService.session?.user?.email?.split("@")[0] ??
      "Unknown"
    );
  }

  private get googleIdentityData(): { full_name?: string | null } | null {
    return (
      (this.authService.session?.user?.identities?.find((identity) => identity.provider === "google")
        ?.identity_data as { full_name?: string | null } | undefined) ?? null
    );
  }

  async ngOnInit(): Promise<void> {
    this.currentUserProfile = await this.currentUserProfileService.getCurrentUserProfile();
  }
}
