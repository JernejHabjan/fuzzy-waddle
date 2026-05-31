import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from "@angular/core";
import { AuthService } from "../../auth/auth.service";
import { UserInstanceService } from "./user-instance.service";
import { DatePipe } from "@angular/common";
import { ProfileNavComponent } from "./profile-nav/profile-nav.component";
import { AngularHost } from "../../shared/consts";
import { CurrentUserProfileService } from "../../data-access/profile/current-user-profile.service";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import {
  faArrowTrendUp,
  faBolt,
  faCalendarDays,
  faClock,
  faGamepad,
  faGlobe,
  faTrophy,
  faUserAstronaut
} from "@fortawesome/free-solid-svg-icons";
import { getRoleIcon, getRoleLabel } from "../../shared/utils/app-role-presentation";
import { GameKey, type CurrentUserProfileDto, type UserGameProfileStatDto } from "@fuzzy-waddle/api-interfaces";
import { AvatarProviderService } from "../../shared/components/chat/avatar-provider/avatar-provider.service";
import { RouterLink } from "@angular/router";

@Component({
  selector: "fuzzy-waddle-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProfileNavComponent, DatePipe, FaIconComponent, RouterLink],
  host: AngularHost.contentFlexFullHeight
})
export class ProfileComponent {
  readonly userId = input<string | null | undefined>(undefined);
  readonly embedded = input(false);
  protected readonly authService = inject(AuthService);
  protected readonly userInstanceService = inject(UserInstanceService);
  protected readonly currentUserProfileService = inject(CurrentUserProfileService);
  protected readonly avatarProviderService = inject(AvatarProviderService);
  protected readonly getRoleIcon = getRoleIcon;
  protected readonly getRoleLabel = getRoleLabel;
  protected readonly faArrowTrendUp = faArrowTrendUp;
  protected readonly faBolt = faBolt;
  protected readonly faCalendarDays = faCalendarDays;
  protected readonly faClock = faClock;
  protected readonly faGamepad = faGamepad;
  protected readonly faGlobe = faGlobe;
  protected readonly faTrophy = faTrophy;
  protected readonly faUserAstronaut = faUserAstronaut;
  protected readonly currentUserProfile = signal<CurrentUserProfileDto | null>(null);
  protected readonly isLoadingProfile = signal(true);

  private profileLoadVersion = 0;

  constructor() {
    effect(() => {
      const userId = this.userId();
      void this.loadProfile(userId);
    });
  }

  protected readonly isViewingSelf = computed(() => {
    const targetUserId = this.userId();
    return !targetUserId || targetUserId === this.authService.userId;
  });

  protected readonly profileDisplayName = computed(
    () =>
      this.currentUserProfile()?.displayName ??
      (this.isViewingSelf()
        ? this.googleIdentityData?.full_name ??
          this.authService.fullName ??
          this.authService.session?.user?.email?.split("@")[0] ??
          "Unknown"
        : "Unknown")
  );

  protected readonly profileAvatarUrl = computed(
    () =>
      this.avatarProviderService.getAvatar(
        this.currentUserProfile()?.id ?? this.userId() ?? this.authService.userId ?? this.profileDisplayName()
      )
  );

  protected readonly profileHandle = computed(() => {
    const username = this.currentUserProfile()?.username;
    return username ? `@${username}` : null;
  });

  protected readonly preferredGame = computed<GameKey | string | null>(
    () =>
      this.currentUserProfile()?.playSummary.preferredGame ??
      (this.isViewingSelf() ? this.userInstanceService.getPreferredGame() : null)
  );

  protected readonly preferredGameLabel = computed(() => this.getGameLabel(this.preferredGame()));

  protected readonly preferredGameRoute = computed(() => this.getGameRoute(this.preferredGame()));

  protected readonly preferredGameSourceLabel = computed(() =>
    this.currentUserProfile()?.playSummary.preferredGame
      ? "Based on recorded play history"
      : this.isViewingSelf()
        ? "Based on recent visits"
        : "No recorded favorite yet"
  );

  protected readonly joinedAt = computed(
    () =>
      this.currentUserProfile()?.createdAt ?? (this.isViewingSelf() ? this.authService.session?.user?.created_at : null) ?? null
  );

  protected readonly profileStats = computed<Array<{ label: string; value: number | string }>>(() => {
    const summary = this.currentUserProfile()?.playSummary;
    if (!summary) {
      return [];
    }

    return [
      { label: "Sessions", value: summary.totalSessions },
      { label: "Wins", value: summary.wins },
      { label: "Scores", value: summary.scoreSubmissions },
      { label: "Achievements", value: summary.achievementsUnlocked }
    ];
  });

  protected readonly topGames = computed<UserGameProfileStatDto[]>(() => this.currentUserProfile()?.playSummary.gameStats ?? []);

  private get googleIdentityData(): { full_name?: string | null } | null {
    return (
      (this.authService.session?.user?.identities?.find((identity) => identity.provider === "google")
        ?.identity_data as { full_name?: string | null } | undefined) ?? null
    );
  }

  private async loadProfile(userId?: string | null): Promise<void> {
    const loadVersion = ++this.profileLoadVersion;
    this.isLoadingProfile.set(true);

    try {
      const profile = await this.currentUserProfileService.getUserProfile(userId);
      if (loadVersion === this.profileLoadVersion) {
        this.currentUserProfile.set(profile);
      }
    } finally {
      if (loadVersion === this.profileLoadVersion) {
        this.isLoadingProfile.set(false);
      }
    }
  }

  protected getGameLabel(gameKey: GameKey | string | null | undefined): string {
    switch (gameKey) {
      case GameKey.ProbableWaffle:
      case "aota":
        return "Ashes of the Ancients";
      case GameKey.LittleMuncher:
        return "Little Muncher";
      case GameKey.FlySquasher:
        return "Fly Squasher";
      default:
        return "Still exploring";
    }
  }

  protected getGameTagline(gameKey: GameKey): string {
    switch (gameKey) {
      case GameKey.ProbableWaffle:
        return "RTS campaigns, skirmishes, and multiplayer battles.";
      case GameKey.LittleMuncher:
        return "Fast runs, hills, and survival streaks.";
      case GameKey.FlySquasher:
        return "Arcade reflexes and leaderboard chases.";
    }
  }

  protected getGameRoute(gameKey: GameKey | string | null | undefined): string[] | null {
    switch (gameKey) {
      case GameKey.ProbableWaffle:
      case "aota":
        return ["/aota"];
      case GameKey.LittleMuncher:
        return ["/little-muncher"];
      case GameKey.FlySquasher:
        return ["/fly-squasher"];
      default:
        return null;
    }
  }
}
