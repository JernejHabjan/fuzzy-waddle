import { Component, inject, OnInit } from "@angular/core";
import { SpectateService } from "./spectate.service";
import { LittleMuncherRoom } from "@fuzzy-waddle/api-interfaces";
import { ServerHealthService } from "../../../shared/services/server-health.service";

@Component({
  selector: "little-muncher-spectate",
  templateUrl: "./spectate.component.html",
  styleUrls: ["./spectate.component.scss"],
  standalone: true,
  imports: []
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
