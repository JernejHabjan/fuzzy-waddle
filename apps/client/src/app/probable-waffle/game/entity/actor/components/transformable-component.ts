import { TilePlacementData_old } from "../../../world/managers/controllers/input/tilemap/tilemap-input.handler";
import { SpriteHelper_old, SpriteWorldPlacementInfo_old } from "../sprite-helper_old";
import { IComponent } from "../../../core/component.service";
import { EventEmitter } from "@angular/core";

export type TransformChange = [TilePlacementData_old, SpriteWorldPlacementInfo_old];

export class TransformComponent implements IComponent {
  readonly onTransformChanged: EventEmitter<TransformChange> = new EventEmitter<TransformChange>();
  tilePlacementData: TilePlacementData_old;
  worldPlacementInfo: SpriteWorldPlacementInfo_old;

  constructor(tilePlacementData: TilePlacementData_old) {
    this.tilePlacementData = tilePlacementData;
    this.worldPlacementInfo = SpriteHelper_old.getSpriteWorldPlacementInfo(tilePlacementData);
  }

  transform(tilePlacementData: TilePlacementData_old): void {
    this.tilePlacementData = tilePlacementData;
    this.worldPlacementInfo = SpriteHelper_old.getSpriteWorldPlacementInfo(tilePlacementData);
    this.onTransformChanged.emit([tilePlacementData, this.worldPlacementInfo]);
  }

  init(): void {
    // pass
  }

  face(tilePlacementData: TilePlacementData_old) {
    // todo use system to communicate between rotationInfo and transformComponent?
  }
}
