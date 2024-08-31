import { Component, inject } from "@angular/core";

import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";

@Component({
  selector: "probable-waffle-spectators-grid",
  standalone: true,
  imports: [],
  templateUrl: "./spectators-grid.component.html",
  styleUrls: ["./spectators-grid.component.scss"]
})
export class SpectatorsGridComponent {
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);
}
