import { Component, inject } from "@angular/core";
import { AuthService } from "../../auth/auth.service";
import { DbAccessTestService } from "../../data-access/db-access-test/db-access-test.service";
import { environment } from "../../../environments/environment";
import { ServerHealthService } from "../../shared/services/server-health.service";

import { ChatFloatComponent } from "../chat/chat-float/chat-float.component";
import { RouterLink } from "@angular/router";
import { HomePageNavComponent } from "./home-page-nav/home-page-nav.component";
import { AngularHost } from "../../shared/consts";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faCopyright, faMusic } from "@fortawesome/free-solid-svg-icons";

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
  imports: [ChatFloatComponent, RouterLink, HomePageNavComponent, FaIconComponent],
  host: AngularHost.contentFlexFullHeight
})
export class HomePageComponent {
  protected readonly faMusic = faMusic;
  protected readonly faCopyright = faCopyright;
  protected readonly environment = environment;
  private readonly currentlyFeaturedGame = "dungeon-crawler";
  displayGames: DisplayGame[] = [
    {
      name: "Probable Waffle",
      description: "A real-time strategy game",
      image: "probable-waffle.webp",
      bannerImage: "probable-waffle-banner.webp",
      route: "probable-waffle",
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
      route: "dungeon-crawler"
    }
  ];

  protected get featuredGame(): DisplayGame {
    return this.displayGames.find((g) => g.route === this.currentlyFeaturedGame)!;
  }

  protected readonly authService = inject(AuthService);
  protected readonly dbAccessTestService = inject(DbAccessTestService);
  protected readonly serverHealthService = inject(ServerHealthService);
}
