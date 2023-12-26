import { Component, inject, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MapPlayerDefinition } from "../skirmish.component";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";

@Component({
  selector: "fuzzy-waddle-spectators-grid",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./spectators-grid.component.html",
  styleUrls: ["./spectators-grid.component.scss"]
})
export class SpectatorsGridComponent {
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);
}
