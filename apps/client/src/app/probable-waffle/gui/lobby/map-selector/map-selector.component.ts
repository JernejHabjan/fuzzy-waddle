import { Component, inject } from "@angular/core";
import { MapPlayerDefinitionsService } from "../map-player-definitions.service";

@Component({
  selector: "probable-waffle-map-selector",
  templateUrl: "./map-selector.component.html",
  styleUrls: ["./map-selector.component.scss"]
})
export class MapSelectorComponent {
  protected readonly mapPlayerDefinitionsService = inject(MapPlayerDefinitionsService);
}
