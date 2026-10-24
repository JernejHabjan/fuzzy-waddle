import { Component, inject, ChangeDetectionStrategy } from "@angular/core";

import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";

@Component({
  selector: "probable-waffle-spectators-grid",
  templateUrl: "./spectators-grid.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ["./spectators-grid.component.scss"]
})
export class SpectatorsGridComponent {
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);
}
