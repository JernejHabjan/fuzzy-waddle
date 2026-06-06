import { Component, inject, type OnInit } from "@angular/core";
import { DatePipe } from "@angular/common";
import { AuthService } from "../../auth/auth.service";
import { environment } from "../../../environments/environment";
import { ServerHealthService } from "../../shared/services/server-health.service";

import { ChatFloatComponent } from "../chat/chat-float/chat-float.component";
import { RouterLink } from "@angular/router";
import { HomePageNavComponent } from "./home-page-nav/home-page-nav.component";
import { AngularHost } from "../../shared/consts";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faCopyright, faMusic, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { AppUserRole } from "@fuzzy-waddle/api-interfaces";
import { CurrentUserProfileService } from "../../data-access/profile/current-user-profile.service";
import { ModerationService } from "../../data-access/moderation/moderation.service";

export type DisplayGame = {
  name: string;
  description: string;
  image: string;
  bannerImage: string;
  route: string;
  inDevelopment?: boolean;
};

@Component({
  templateUrl: "./home-page.component.html",
  styleUrls: ["./home-page.component.scss"],
  imports: [ChatFloatComponent, RouterLink, HomePageNavComponent, FaIconComponent, DatePipe],
  host: AngularHost.contentFlexFullHeight
})
export class HomePageComponent implements OnInit {
  protected readonly faMusic = faMusic;
  protected readonly faCopyright = faCopyright;
  protected readonly faShieldHalved = faShieldHalved;
  protected readonly environment = environment;
  protected pendingModerationCount = 0;
  protected isModerator = false;
  protected isBanned = false;
  protected bannedUntil: string | null = null;
  protected moderationNote: string | null = null;
  private readonly currentlyFeaturedGame = "dungeon-crawler";
  displayGames: DisplayGame[] = [
    {
      name: "Ashes of the Ancients",
      description: "A real-time strategy game",
      image: "probable-waffle.webp",
      bannerImage: "probable-waffle-banner.webp",
      route: "aota",
      inDevelopment: true
    },
    {
      name: "Little Muncher",
      description: "Infinite scroller",
      image: "little-muncher.webp",
      bannerImage: "probable-waffle-banner.webp",
      route: "little-muncher"
    },
    {
      name: "Fly Squasher",
      description: "Squash dem bugs",
      image: "fly-squasher.webp",
      bannerImage: "fly-squasher-banner.webp",
      route: "fly-squasher"
    },
    {
      name: "Dungeon Crawler",
      description: "Creepy crawlies",
      image: "dungeon-crawler.webp",
      bannerImage: "dungeon-crawler-banner.webp",
      route: "dungeon-crawler",
      inDevelopment: true
    }
  ];

  protected get featuredGame(): DisplayGame {
    return this.displayGames.find((g) => g.route === this.currentlyFeaturedGame)!;
  }

  protected readonly authService = inject(AuthService);
  protected readonly serverHealthService = inject(ServerHealthService);
  private readonly moderationService = inject(ModerationService);
  private readonly currentUserProfileService = inject(CurrentUserProfileService);

  async ngOnInit(): Promise<void> {
    if (!this.authService.isAuthenticated) {
      return;
    }

    try {
      const profile = await this.currentUserProfileService.getCurrentUserProfile();
      this.isBanned = profile?.isBanned ?? false;
      this.bannedUntil = profile?.bannedUntil ?? null;
      this.moderationNote = profile?.moderationNote ?? null;
      this.isModerator =
        !!profile && !profile.isBanned && (profile.role === AppUserRole.Moderator || profile.role === AppUserRole.Admin);
      if (!this.isModerator) {
        return;
      }

      const summary = await this.moderationService.getSummary();
      this.pendingModerationCount = summary.pendingReportCount;
    } catch {
      this.isModerator = false;
    }
  }
}
