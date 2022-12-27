import * as Phaser from 'phaser';
import { PlaceableActor } from './characters/placeable-actor';
import { TilePlacementData } from './input/tilemap/tilemap-input.handler';
import { SpriteHelper, SpritePlacementData } from './sprite/sprite-helper';
import ComponentService from './services/component.service';
import { v4 as uuidv4 } from 'uuid';
export abstract class Actor extends Phaser.GameObjects.Sprite implements PlaceableActor {
  tilePlacementData: TilePlacementData;
  components: ComponentService;

  protected constructor(scene: Phaser.Scene, spritePlacementData: SpritePlacementData) {
    const spriteWorldPlacementInfo = SpriteHelper.getSpriteWorldPlacementInfo(spritePlacementData.tilePlacementData);
    super(scene, spriteWorldPlacementInfo.x, spriteWorldPlacementInfo.y, spritePlacementData.textureName);
    this.tilePlacementData = spritePlacementData.tilePlacementData;
    this.name = uuidv4(); // give it a unique name
    this.components = new ComponentService(this.name);
    this.depth = spriteWorldPlacementInfo.depth;
  }
}
