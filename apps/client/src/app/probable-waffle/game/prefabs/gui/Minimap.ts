// You can write more code here

/* START OF COMPILED CODE */

import OnPointerDownScript from "../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { getSceneComponent, getSceneService } from "../../world/components/scene-component-helpers";
import { TilemapComponent } from "../../world/components/tilemap.component";
import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "../../data/actor-component";
import { ObjectDescriptorComponent } from "../../entity/components/object-descriptor-component";
import { getTileCoordsUnderObject } from "../../library/tile-under-object";
import { OwnerComponent } from "../../entity/components/owner-component";
import HudProbableWaffle from "../../world/scenes/hud-scenes/HudProbableWaffle";
import { MultiSelectionHandler } from "../../world/managers/controllers/input/multi-selection.handler";
import { NavigationService } from "../../world/services/navigation.service";
import { throttle } from "../../library/throttle";
import { FogOfWarComponent, FogOfWarMode } from "../../world/components/fog-of-war.component";
import { VisionComponent } from "../../entity/components/vision-component";
import { PlayerActionsHandler } from "../../world/managers/controllers/PlayerActionsHandler";
import { type GameObjectActionAssignerConfig } from "../../world/managers/controllers/game-object-action-assigner";
import { OrderType } from "../../ai/order-type";
/* END-USER-IMPORTS */

export default class Minimap extends Phaser.GameObjects.Container {
  static assignActorActionToTileCoordinatesEvent = "assignActorActionToTileCoordinates";
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
      64,
      48,
      3,
      3,
      3,
      3
    );
    minimap_bg.scaleX = 6.360057500071948;
    minimap_bg.scaleY = 4.918865473567761;
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
  private fogOfWarComponent?: FogOfWarComponent;
  private playerActionsHandler?: PlayerActionsHandler;

  initializeWithParentScene(probableWaffleScene: ProbableWaffleScene, hudProbableWaffle: HudProbableWaffle) {
    this.probableWaffleScene = probableWaffleScene;
    this.hudProbableWaffle = hudProbableWaffle;
    this.fogOfWarComponent = getSceneComponent(probableWaffleScene, FogOfWarComponent);
    this.playerActionsHandler = getSceneService(probableWaffleScene, PlayerActionsHandler);
    this.redrawMinimap();
    this.probableWaffleScene.events.on(NavigationService.UpdateNavigationEvent, this.throttleRedrawMinimap, this);
    this.probableWaffleScene.events.on(Phaser.Scenes.Events.UPDATE, this.throttleRedrawMinimap, this); // TODO FOR SOME REASON UpdateNavigationEvent doesnt get triggered
  }

  private throttleRedrawMinimap = throttle(this.redrawMinimap.bind(this), 1000);

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
    color: Phaser.Display.Color,
    alpha: number = 1
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
      color.color,
      alpha
    );
    diamond.setInteractive(new Phaser.Geom.Polygon(diamondPoints), Phaser.Geom.Polygon.Contains);
    return diamond;
  }

  /**
   * Phaser darken doesn't work as desired
   */
  private darken(color: Phaser.Display.Color): Phaser.Display.Color {
    return new Phaser.Display.Color(
      Math.floor(color.red * 0.6 + 40),
      Math.floor(color.green * 0.6 + 40),
      Math.floor(color.blue * 0.6 + 40)
    );
  }

  private getTileVisibilityColor(tileX: number, tileY: number, baseColor: Phaser.Display.Color): Phaser.Display.Color {
    if (!this.fogOfWarComponent || this.fogOfWarComponent.getMode() === FogOfWarMode.ALL_VISIBLE) {
      return baseColor;
    }

    const visibility = this.fogOfWarComponent.getTileVisibility(tileX, tileY);

    switch (visibility) {
      case "visible":
        return baseColor;
      case "explored":
        return this.darken(baseColor);
      case "unexplored":
      default:
        const mode = this.fogOfWarComponent.getMode();
        if (mode === FogOfWarMode.PRE_EXPLORED) {
          return this.darken(baseColor);
        } else if (mode === FogOfWarMode.FULL_EXPLORATION) {
          // return black
          return new Phaser.Display.Color(51, 51, 51);
        } else {
          return baseColor;
        }
    }
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
        const tile = layerData[i]![j]!;
        const baseColor = this.getColorFromTiledProperty(tile) ?? Phaser.Display.Color.RandomRGB();

        // Get tile visibility and apply appropriate color/alpha
        const color = this.getTileVisibilityColor(j, i, baseColor);

        const isoX = offsetX + (j - i) * (pixelWidth / 2);
        const isoY = (i + j) * (pixelHeight / 2);
        const diamond = this.createDiamondShape(x, y, isoX, isoY, pixelWidth, pixelHeight, color);

        // Pointer over is needed for continuous camera movement while dragging
        diamond.on(Phaser.Input.Events.POINTER_OVER, (pointer: Phaser.Input.Pointer) => {
          if (this.playerActionsHandler?.isHandlingActions()) return;
          if (multiSelectionHandler?.multiSelecting) return;
          if (pointer.leftButtonDown()) {
            this.moveCameraToTileCoordinates({ x: i, y: j });
          }
        });
        // pointer down is needed for single minimap click to move camera or assign action
        diamond.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
          if (multiSelectionHandler?.multiSelecting) return;
          const isHandlingPlayerAction = this.playerActionsHandler?.isHandlingActions() === true;
          if (pointer.rightButtonDown() || isHandlingPlayerAction) {
            const tileVec3 = { x: j, y: i, z: 0 };
            const orderType = this.playerActionsHandler?.getCurrentOrderType() ?? OrderType.Move;
            this.assignActorActionToTileCoordinates(tileVec3, orderType);
          } else if (pointer.leftButtonDown()) {
            this.moveCameraToTileCoordinates({ x: i, y: j });
          }
          this.playerActionsHandler?.stopOrderCommand();
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

  private assignActorActionToTileCoordinates(tileVec3: Vector3Simple, orderType: OrderType) {
    if (!this.probableWaffleScene) throw new Error("Parent scene not set");
    // console.log("Assigning action to tile coordinates", tileVec3, "with order type", orderType);
    this.probableWaffleScene.events.emit(Minimap.assignActorActionToTileCoordinatesEvent, {
      tileVec3,
      orderType
    } satisfies GameObjectActionAssignerConfig);
  }

  private shouldShowActorOnMinimap(actor: Phaser.GameObjects.GameObject): boolean {
    if (!this.fogOfWarComponent) return true;

    // If fog-of-war is set to ALL_VISIBLE, always show actors
    if (this.fogOfWarComponent.getMode() === FogOfWarMode.ALL_VISIBLE) {
      return true;
    }

    // Get the vision component to check if the actor is visible
    const visionComponent = getActorComponent(actor, VisionComponent);
    if (visionComponent) {
      return visionComponent.visibilityByCurrentPlayer;
    }

    return true; // Default to showing if no visibility logic applies
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

      // Skip actors that shouldn't be visible due to fog-of-war
      if (!this.shouldShowActorOnMinimap(child)) return;

      const tilesUnderObject: Vector2Simple[] = getTileCoordsUnderObject(tileMapComponent.tilemap, child);
      const ownerColor = getActorComponent(child, OwnerComponent)?.ownerColor;
      const defaultColor = objectDescriptor.objectDescriptorDefinition?.color;

      const black = new Phaser.Display.Color(0, 0, 0);
      const fallbackColor =
        defaultColor === null ? null : defaultColor ? Phaser.Display.Color.IntegerToColor(defaultColor) : black;
      const color = ownerColor ?? fallbackColor;

      if (color) {
        for (const tile of tilesUnderObject) {
          let shouldShow = true;

          // Apply visibility rules based on fog of war mode
          if (this.fogOfWarComponent && this.fogOfWarComponent.getMode() === FogOfWarMode.FULL_EXPLORATION) {
            const tileVisibility = this.fogOfWarComponent.getTileVisibility(tile.x, tile.y);

            if (tileVisibility === "unexplored") {
              shouldShow = false;
            }
          }

          if (shouldShow) {
            const isoX = offsetX + (tile.x - tile.y) * (pixelWidth / 2);
            const isoY = (tile.x + tile.y) * (pixelHeight / 2);
            const diamond = this.createDiamondShape(x, y, isoX, isoY, pixelWidth, pixelHeight, color);
            this.actorDiamonds.push(diamond);
          }
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

  override destroy(fromScene?: boolean) {
    this.minimapDiamonds.forEach((diamond) => diamond.destroy());
    this.actorDiamonds.forEach((diamond) => diamond.destroy());
    this.probableWaffleScene?.events.off(NavigationService.UpdateNavigationEvent, this.throttleRedrawMinimap, this);
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
