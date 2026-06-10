import { Component, inject, output } from "@angular/core";
import {
  type HillData,
  type LittleMuncherGameCreate,
  LittleMuncherHillEnum,
  LittleMuncherHills
} from "@fuzzy-waddle/api-interfaces";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { AuthService } from "../../auth/auth.service";
import { KeyValuePipe } from "@angular/common";
import { SpectateComponent } from "./spectate/spectate.component";
import { AngularHost } from "../../shared/consts";
import { HomeNavComponent } from "../../shared/components/home-nav/home-nav.component";
import { RouterLink } from "@angular/router";

@Component({
  selector: "little-muncher-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  imports: [SpectateComponent, HomeNavComponent, KeyValuePipe, RouterLink],
  host: AngularHost.contentFlexFullHeight
})
export class HomeComponent {
  protected readonly LittleMuncherHills = LittleMuncherHills;
  protected readonly hillCount = Object.keys(LittleMuncherHills).length;
  protected readonly featureList = [
    "Dash through cake-heavy lanes built around different hill routes.",
    "Swap between shorter and longer runs with different pacing.",
    "Jump into spectator rooms or save leaderboard attempts when the server is online."
  ];
  readonly startLevel = output<LittleMuncherGameCreate>();
  protected readonly serverHealthService = inject(ServerHealthService);
  protected readonly authService = inject(AuthService);

  climbOn(hillKey: unknown) {
    this.startLevel.emit({
      level: { hill: hillKey as LittleMuncherHillEnum },
      player_ids: [this.authService.userId as string]
    });
  }

  getHillName = (hill: HillData) => hill.name + " " + hill.height + "m";
}
