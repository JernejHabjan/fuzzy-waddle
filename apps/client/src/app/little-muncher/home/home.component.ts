import { Component, EventEmitter, inject, Output } from "@angular/core";
import {
  HillData,
  LittleMuncherGameCreate,
  LittleMuncherHillEnum,
  LittleMuncherHills
} from "@fuzzy-waddle/api-interfaces";
import { ServerHealthService } from "../../shared/services/server-health.service";
import { AuthService } from "../../auth/auth.service";
import { CommonModule } from "@angular/common";
import { SpectateComponent } from "./spectate/spectate.component";
import { LoaderComponent } from "../../shared/loader/loader.component";
import { RouterLink } from "@angular/router";
import { AngularHost } from "../../shared/consts";

@Component({
  selector: "little-muncher-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  standalone: true,
  imports: [CommonModule, SpectateComponent, LoaderComponent, RouterLink],
  host: AngularHost.contentFlexFullHeightCenter
})
export class HomeComponent {
  protected readonly LittleMuncherHills = LittleMuncherHills;
  @Output() startLevel: EventEmitter<LittleMuncherGameCreate> = new EventEmitter<LittleMuncherGameCreate>();
  protected readonly serverHealthService = inject(ServerHealthService);
  private readonly authService = inject(AuthService);

  climbOn(hillKey: unknown) {
    this.startLevel.next({
      level: { hill: hillKey as LittleMuncherHillEnum },
      player_ids: [this.authService.userId as string]
    });
  }

  getHillName = (hill: HillData) => hill.name + " " + hill.height + "m";
}
