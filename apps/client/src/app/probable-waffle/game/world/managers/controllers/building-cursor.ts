// when placing new building
import { MapSizeInfo } from "../../const/map-size.info";
import { AttackComponent } from "../../../entity/combat/components/attack-component";
import { ConstructionSiteComponent } from "../../../entity/building/construction/construction-site-component";
import { RepresentableActor } from "../../../entity/actor/representable-actor";
import { Scene, Types } from "phaser";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";

export class BuildingCursor {
  placementGrid: unknown; // todo
  gridWidthAndHeight: {
    width: number;
    height: number;
  } | null = null;
  previewAttackRange = false;

  allCellsAreValid = false;
  private building?: RepresentableActor;

  private pointerLocation?: Vector2Simple;

  constructor(private scene: Scene) {}

  canConstructBuildingAt(location: Types.Math.Vector3Like): boolean {
    // todo
    return true;
  }

  setPointerLocation(pointerLocation: Vector2Simple) {
    this.pointerLocation = pointerLocation;
  }

  setupForBuilding(building: RepresentableActor) {
    // todo obtains gridWidthAndHeight from buildingClass
    // get ConstructionSiteComponent from buildingClass
    this.building = building;

    const constructionSiteComponent = building.components.findComponent(ConstructionSiteComponent);
    const attackComponent = building.components.findComponent(AttackComponent);
    this.gridWidthAndHeight = { height: 3, width: 2 }; // todo constructionSiteComponent.gridWidthAndHeight;
    this.previewAttackRange = !!attackComponent;
  }

  hasGrid(): boolean {
    return !!this.placementGrid;
  }

  tick(time: number, delta: number) {
    if (!this.hasGrid()) {
      return;
    }
    this.allCellsAreValid = true;

    // draw grid and color cells that are not valid
    this.drawPlacementGrid();
    this.drawBuilding();
  }

  private drawPlacementGrid() {
    if (!this.gridWidthAndHeight) {
      return;
    }
    // create isometric grid of height and width defined in gridWidthAndHeight
    for (let x = 0; x < this.gridWidthAndHeight.width; x++) {
      for (let y = 0; y < this.gridWidthAndHeight.height; y++) {
        this.drawIsometricShape();
      }
    }
  }

  // fills with red if not valid
  private drawIsometricShape(isValid: boolean = true) {
    const width = MapSizeInfo.info.tileWidth;
    const height = MapSizeInfo.info.tileHeight;
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(2, 0x000000, 1);
    graphics.fillStyle(isValid ? 0x00ff00 : 0xff0000, 1);
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.lineTo(width, 0);
    graphics.lineTo(width / 2, height);
    graphics.lineTo(0, 0);
    graphics.closePath();
    graphics.strokePath();
    graphics.fillPath();
  }

  // draws building nearly transparent
  private drawBuilding() {
    if (!this.building || !this.pointerLocation) {
      return;
    }
    // todo const buildingSprite = this.building.spriteRepresentationComponent.sprite;
    // todo buildingSprite.setPosition(this.pointerLocation.x, this.pointerLocation.y);
    // todo buildingSprite.setAlpha(0.5);
    // todo buildingSprite.setVisible(true);
  }
}
