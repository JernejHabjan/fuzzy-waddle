import { Component, inject } from "@angular/core";
import { ServerHealthService } from "@fuzzy-waddle/portal/shared/services/server-health.service";
import { AuthService } from "@fuzzy-waddle/portal/auth/auth.service";
import { MatchmakingComponent } from "./matchmaking/matchmaking.component";
import { HostComponent } from "./host/host.component";
import { LobbiesComponent } from "./lobbies/lobbies.component";
import { HomeNavComponent } from "@fuzzy-waddle/portal/shared/components/home-nav/home-nav.component";
import { RouterLink } from "@angular/router";
import { AngularHost } from "@fuzzy-waddle/portal/shared/consts";

@Component({
  selector: "probable-waffle-online",
  templateUrl: "./online.component.html",
  styleUrls: ["./online.component.scss"],
  standalone: true,
  imports: [MatchmakingComponent, HostComponent, LobbiesComponent, HomeNavComponent, RouterLink],
  host: AngularHost.contentFlexFullHeight
})
export class OnlineComponent {
  protected selectedTab: string = "join";
  protected selectedMode: "custom" | "matchmaking" | null = null;
  protected readonly serverHealthService = inject(ServerHealthService);
  protected readonly authService = inject(AuthService);

  protected selectTab(tab: string) {
    this.selectedTab = tab;
  }

  protected selectMode(mode: "custom" | "matchmaking") {
    this.selectedMode = mode;
  }
}
