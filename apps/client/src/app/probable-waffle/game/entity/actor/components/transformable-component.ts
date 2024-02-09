import { TilePlacementData } from "../../../world/managers/controllers/input/tilemap/tilemap-input.handler";
import { SpriteHelper, SpriteWorldPlacementInfo } from "../sprite-helper";
import { IComponent } from "../../../core/component.service";
import { EventEmitter } from "@angular/core";

export type TransformChange = [TilePlacementData, SpriteWorldPlacementInfo];

export class TransformComponent implements IComponent {
  readonly onTransformChanged: EventEmitter<TransformChange> = new EventEmitter<TransformChange>();
  tilePlacementData: TilePlacementData;
  worldPlacementInfo: SpriteWorldPlacementInfo;

  constructor(tilePlacementData: TilePlacementData) {
    this.tilePlacementData = tilePlacementData;
    this.worldPlacementInfo = SpriteHelper.getSpriteWorldPlacementInfo(tilePlacementData);
  }

  transform(tilePlacementData: TilePlacementData): void {
    this.tilePlacementData = tilePlacementData;
    this.worldPlacementInfo = SpriteHelper.getSpriteWorldPlacementInfo(tilePlacementData);
    this.onTransformChanged.emit([tilePlacementData, this.worldPlacementInfo]);
  }

  init(): void {
    // pass
  }

  face(tilePlacementData: TilePlacementData) {
    // todo use system to communicate between rotationInfo and transformComponent?
  }
}
