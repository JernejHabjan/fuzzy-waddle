import { Component, inject } from "@angular/core";
import type { OnInit } from "@angular/core";
import { SpectateService } from "./spectate.service";
import { type LittleMuncherRoom } from "@fuzzy-waddle/little-muncher-protocol";
import { ServerHealthService } from "@fuzzy-waddle/platform-game-host/angular/services/server-health.service";

@Component({
  selector: "little-muncher-spectate",
  templateUrl: "./spectate.component.html",
  styleUrls: ["./spectate.component.scss"]
})
export class SpectateComponent implements OnInit {
  protected readonly spectateService = inject(SpectateService);
  protected readonly serverHealthService = inject(ServerHealthService);

  async ngOnInit(): Promise<void> {
    await this.spectateService.initiallyPullRooms();
  }

  async spectate(room: LittleMuncherRoom) {
    await this.spectateService.joinRoom(room.gameInstanceMetadataData.gameInstanceId!);
  }
}
