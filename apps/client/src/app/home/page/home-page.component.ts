import { Component, inject } from "@angular/core";
import { AuthService } from "../../auth/auth.service";
import { DbAccessTestService } from "../../data-access/db-access-test/db-access-test.service";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { firstValueFrom } from "rxjs";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { CommonModule } from "@angular/common";
import { ChatFloatComponent } from "../chat/chat-float/chat-float.component";
import { RouterLink } from "@angular/router";
import { HomePageNavComponent } from "./home-page-nav/home-page-nav.component";

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
  standalone: true,
  imports: [CommonModule, ChatFloatComponent, RouterLink, HomePageNavComponent]
})
export class HomePageComponent {
  protected readonly environment = environment;
  private readonly currentlyFeaturedGame = "fly-squasher";
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
    }
  ];

  protected get featuredGame(): DisplayGame {
    return this.displayGames.find((g) => g.route === this.currentlyFeaturedGame)!;
  }

  protected readonly authService = inject(AuthService);
  protected readonly dbAccessTestService = inject(DbAccessTestService);
  protected readonly serverHealthService = inject(ServerHealthService);
  private readonly httpClient = inject(HttpClient); // todo remove httpClient from view!

  async addViaMw(): Promise<void> {
    // todo remove this - this is just for testing
    const url = environment.api + "api/message";
    return await firstValueFrom(this.httpClient.post<void>(url, { message: "test123" }));
  }
}
