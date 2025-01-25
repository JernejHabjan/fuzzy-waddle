// You can write more code here

/* START OF COMPILED CODE */

import OnPointerDownScript from "../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { getSceneComponent } from "../../scenes/components/scene-component-helpers";
import { TilemapComponent } from "../../scenes/components/tilemap.component";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "../../data/actor-component";
import { ObjectDescriptorComponent } from "../../entity/actor/components/object-descriptor-component";
import { getTileCoordsUnderObject } from "../../library/tile-under-object";
import { OwnerComponent } from "../../entity/actor/components/owner-component";
import HudProbableWaffle from "../../scenes/HudProbableWaffle";
import { MultiSelectionHandler } from "../../world/managers/controllers/input/multi-selection.handler";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Minimap extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    this.scaleX = 1.0265358293529236;
    this.scaleY = 0.9537232846001076;

    // minimap_bg
    const minimap_bg = scene.add.nineslice(
      12,
      -247,
      "gui",
      "cryos_mini_gui/surfaces/surface_parchment.png",
      32,
      32,
      3,
      3,
      3,
      3
    );
    minimap_bg.scaleX = 12.769367198119731;
    minimap_bg.scaleY = 7.444257731898887;
    minimap_bg.setOrigin(0, 0);
    this.add(minimap_bg);

    // preventDefaultScript_1
    new OnPointerDownScript(minimap_bg);

    // minimap_border
    const minimap_border = scene.add.nineslice(
      0,
      -255.17628729694155,
      "gui",
      "cryos_mini_gui/borders/border_wood.png",
      128,
      92,
      4,
      4,
      4,
      4
    );
    minimap_border.scaleX = 3.367102972114097;
    minimap_border.scaleY = 2.7741914555176357;
    minimap_border.setOrigin(0, 0);
    this.add(minimap_border);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private minimapDiamonds: Phaser.GameObjects.Polygon[] = [];
  private actorDiamonds: Phaser.GameObjects.Polygon[] = [];
  private readonly minimapWidth = 400;
  private readonly smallMinimapWidth = 200;
  readonly minimapHideBreakpoint = 500;
  readonly minimapSmallScreenBreakpoint = 800;
  private readonly minimapMargin = 20;
  private probableWaffleScene?: ProbableWaffleScene;
  private hudProbableWaffle?: HudProbableWaffle;

  initializeWithParentScene(probableWaffleScene: ProbableWaffleScene, hudProbableWaffle: HudProbableWaffle) {
    this.probableWaffleScene = probableWaffleScene;
    this.hudProbableWaffle = hudProbableWaffle;
    this.redrawMinimap();
  }

  redrawMinimap() {
    if (!this.probableWaffleScene || !this.hudProbableWaffle) return;
    const sceneWidth = this.hudProbableWaffle.scale.width;
    if (sceneWidth < this.minimapHideBreakpoint) return;
    const tileMapComponent = getSceneComponent(this.probableWaffleScene, TilemapComponent);
    if (!tileMapComponent) throw new Error("Tilemap component not found on parent scene");
    const width = tileMapComponent.tilemap.width;
    const widthInPixels = sceneWidth > this.minimapSmallScreenBreakpoint ? this.minimapWidth : this.smallMinimapWidth;
    const y = this.hudProbableWaffle.scale.height - widthInPixels / 2;
    const data = tileMapComponent.data;
    this.createIsometricMinimap(widthInPixels, width, this.minimapMargin, y - this.minimapMargin, data);
    this.fillMinimapWithActors(widthInPixels, width, this.minimapMargin, y - this.minimapMargin); // todo? subscribe to actor added/removed/moved
  }

  private createDiamondShape(
    x: number,
    y: number,
    isoX: number,
    isoY: number,
    pixelWidth: number,
    pixelHeight: number,
    color: Phaser.Display.Color
  ): Phaser.GameObjects.Polygon {
    const diamondPoints = [
      { x: isoX, y: isoY + pixelHeight / 2 },
      { x: isoX + pixelWidth / 2, y: isoY },
      { x: isoX + pixelWidth, y: isoY + pixelHeight / 2 },
      { x: isoX + pixelWidth / 2, y: isoY + pixelHeight }
    ];
    if (!this.hudProbableWaffle) throw new Error("Parent scene not set");
    const diamond = this.hudProbableWaffle.add.polygon(
      x + pixelWidth / 2,
      y + pixelHeight / 2,
      diamondPoints,
      color.color
    );
    diamond.setInteractive(new Phaser.Geom.Polygon(diamondPoints), Phaser.Geom.Polygon.Contains);
    return diamond;
  }

  private createIsometricMinimap(
    widthInPixels: number,
    widthInTiles: number,
    x: number,
    y: number,
    layerData: Phaser.Tilemaps.Tile[][]
  ) {
    const height = widthInPixels / 2;
    const pixelWidth = widthInPixels / widthInTiles;
    const pixelHeight = height / widthInTiles;
    const centerX = widthInPixels / 2;
    const offsetX = centerX - pixelWidth / 2;

    this.minimapDiamonds.forEach((diamond) => diamond.destroy());
    this.minimapDiamonds = [];

    if (!this.hudProbableWaffle) throw new Error("Parent scene not set");
    const multiSelectionHandler = getSceneComponent(this.hudProbableWaffle, MultiSelectionHandler);
    if (!multiSelectionHandler) throw new Error("MultiSelectionHandler not found on parent");

    for (let i = 0; i < widthInTiles; i++) {
      for (let j = 0; j < widthInTiles; j++) {
        const tile = layerData[i][j];
        const color = this.getColorFromTiledProperty(tile) ?? Phaser.Display.Color.RandomRGB();
        const isoX = offsetX + (j - i) * (pixelWidth / 2);
        const isoY = (i + j) * (pixelHeight / 2);
        const diamond = this.createDiamondShape(x, y, isoX, isoY, pixelWidth, pixelHeight, color);
        diamond.on(Phaser.Input.Events.POINTER_OVER, (pointer: Phaser.Input.Pointer) => {
          if (multiSelectionHandler?.multiSelecting) return;
          if (pointer.rightButtonDown()) {
            this.assignActorActionToTileCoordinates({ x: i, y: j });
            // Handle right-click logic here
          } else if (pointer.leftButtonDown()) {
            this.moveCameraToTileCoordinates({ x: i, y: j });
          }
        });
        this.minimapDiamonds.push(diamond);
      }
    }
  }

  private getIsometricCoordinates(tileXY: Vector2Simple): { isoX: number; isoY: number } | null {
    const { x, y } = tileXY;

    if (!this.probableWaffleScene) throw new Error("Parent scene not set");
    const tileMapComponent = getSceneComponent(this.probableWaffleScene, TilemapComponent);
    if (!tileMapComponent) throw new Error("Tilemap component not found on parent scene");

    const tile = tileMapComponent.tilemap.getTileAt(x, y);
    if (!tile) return null;

    const isoX = (y - x) * (tile.width / 2);
    const isoY = (x + y) * (tile.height / 2);

    return { isoX, isoY };
  }

  private moveCameraToTileCoordinates(tileXY: Vector2Simple) {
    if (!this.probableWaffleScene) throw new Error("Parent scene not set");
    const isoCoords = this.getIsometricCoordinates(tileXY);
    if (!isoCoords) return;

    const { isoX, isoY } = isoCoords;
    this.probableWaffleScene.cameras.main.pan(isoX, isoY, 50, Phaser.Math.Easing.Quadratic.InOut);
  }

  private assignActorActionToTileCoordinates(tileXY: Vector2Simple) {
    if (!this.probableWaffleScene) throw new Error("Parent scene not set");
    const isoCoords = this.getIsometricCoordinates(tileXY);
    if (!isoCoords) return;

    const { isoX, isoY } = isoCoords;
    console.log("Assigning action to tile coordinates", isoX, isoY);
    this.probableWaffleScene.events.emit("assignActorActionToTileCoordinates", { x: isoX, y: isoY }); // todo - use this event to move actor to X, Y tile or attack move or set rally etc...
  }

  private fillMinimapWithActors(widthInPixels: number, widthInTiles: number, x: number, y: number) {
    if (!this.probableWaffleScene) throw new Error("Parent scene not set");
    const tileMapComponent = getSceneComponent(this.probableWaffleScene, TilemapComponent);
    if (!tileMapComponent) throw new Error("Tilemap component not found on parent scene");

    const height = widthInPixels / 2;
    const pixelWidth = widthInPixels / widthInTiles;
    const pixelHeight = height / widthInTiles;
    const centerX = widthInPixels / 2;
    const offsetX = centerX - pixelWidth / 2;

    this.actorDiamonds.forEach((diamond) => diamond.destroy());
    this.actorDiamonds = [];
    this.probableWaffleScene.scene.scene.children.each((child) => {
      const objectDescriptor = getActorComponent(child, ObjectDescriptorComponent);
      if (!objectDescriptor) return;

      // const colliderComponent = getActorComponent(child, ColliderComponent);
      // if (!colliderComponent) return;

      const tilesUnderObject: Vector2Simple[] = getTileCoordsUnderObject(tileMapComponent.tilemap, child);
      const ownerColor = getActorComponent(child, OwnerComponent)?.ownerColor;
      // example of default color is 13025801 which is 0xc6c209
      const defaultColor = objectDescriptor.objectDescriptorDefinition?.color;

      const black = new Phaser.Display.Color(0, 0, 0);
      const fallbackColor =
        defaultColor === null ? null : defaultColor ? Phaser.Display.Color.IntegerToColor(defaultColor) : black;
      const color = ownerColor ?? fallbackColor;

      if (color) {
        for (const tile of tilesUnderObject) {
          const isoX = offsetX + (tile.x - tile.y) * (pixelWidth / 2);
          const isoY = (tile.x + tile.y) * (pixelHeight / 2);
          const diamond = this.createDiamondShape(x, y, isoX, isoY, pixelWidth, pixelHeight, color);
          this.actorDiamonds.push(diamond);
        }
      }
    });
  }

  private getColorFromTiledProperty(tile: Phaser.Tilemaps.Tile): Phaser.Display.Color | null {
    const color = tile.properties["color"];
    if (color) {
      // removes leading "#" and "ff"
      return Phaser.Display.Color.HexStringToColor(color.substring(3));
    }
    return null;
  }
}

/* END OF COMPILED CODE */

// You can write more code here
