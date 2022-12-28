import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { SpriteHelper, SpriteWorldPlacementInfo } from '../sprite/sprite-helper';
import { IComponent } from '../services/component.service';
import { EventEmitter } from '@angular/core';

export interface ITransformable {
  transformComponent: TransformComponent;
}

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
}
