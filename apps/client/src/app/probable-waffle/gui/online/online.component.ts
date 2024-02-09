import { Component, inject } from "@angular/core";
import { ServerHealthService } from "../../../shared/services/server-health.service";
import { AuthService } from "../../../auth/auth.service";
import { CommonModule } from "@angular/common";
import { MatchmakingComponent } from "./matchmaking/matchmaking.component";
import { HostComponent } from "./host/host.component";
import { LobbiesComponent } from "./lobbies/lobbies.component";
import { HomeNavComponent } from "../../../shared/components/home-nav/home-nav.component";
import { RouterLink } from "@angular/router";

@Component({
  templateUrl: "./online.component.html",
  styleUrls: ["./online.component.scss"],
  standalone: true,
  imports: [CommonModule, MatchmakingComponent, HostComponent, LobbiesComponent, HomeNavComponent, RouterLink]
})
export class OnlineComponent {
  protected selectedTab: string = "join";
  protected readonly serverHealthService = inject(ServerHealthService);
  protected readonly authService = inject(AuthService);

  protected selectTab(tab: string) {
    this.selectedTab = tab;
  }
}
