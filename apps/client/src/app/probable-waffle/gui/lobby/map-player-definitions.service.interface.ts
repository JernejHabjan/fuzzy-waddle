import { MapPlayerDefinition } from "./map-player-definition";
import { Subject } from "rxjs";
import { PositionPlayerDefinition } from "@fuzzy-waddle/api-interfaces";

export interface MapPlayerDefinitionsServiceInterface {
  init(): void;
  mapPlayerDefinitions: MapPlayerDefinition[];
  selectedMap: MapPlayerDefinition | null;
  playerRemoved: Subject<PositionPlayerDefinition>;
  gameModeOrMapChanged: Subject<void>;
}
