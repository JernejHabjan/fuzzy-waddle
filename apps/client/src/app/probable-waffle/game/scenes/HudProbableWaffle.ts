// You can write more code here

/* START OF COMPILED CODE */

import ActorActions from "../prefabs/gui/buttons/ActorActions";
import GameActions from "../prefabs/gui/buttons/GameActions";
import Resources from "../prefabs/gui/labels/Resources";
import ActorInfo from "../prefabs/gui/labels/ActorInfo";
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { HudGameState } from "../hud/hud-game-state";
import { HudElementVisibilityHandler } from "../hud/hud-element-visibility.handler";
import { CursorHandler } from "../world/managers/controllers/input/cursor.handler";
import { MultiSelectionHandler } from "../world/managers/controllers/input/multi-selection.handler";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { getSceneComponent } from "./components/scene-component-helpers";
import { TilemapComponent } from "./components/tilemap.component";
import { getActorComponent } from "../data/actor-component";
import { getTileCoordsUnderObject } from "../library/tile-under-object";
import { OwnerComponent } from "../entity/actor/components/owner-component";
import { ObjectDescriptorComponent } from "../entity/actor/components/object-descriptor-component";
import { getGameObjectBounds } from "../data/game-object-helper";
import { filter, Subscription } from "rxjs";
/* END-USER-IMPORTS */

export default class HudProbableWaffle extends ProbableWaffleScene {
  constructor() {
    super("HudProbableWaffle");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // actor_actions_container
    const actor_actions_container = new ActorActions(this, 1280, 720);
    this.add.existing(actor_actions_container);

    // minimap_container
    const minimap_container = this.add.container(0, 720);
    minimap_container.scaleX = 1.0265358293529236;
    minimap_container.scaleY = 0.9537232846001076;

    // minimap_bg
    const minimap_bg = this.add.nineslice(
      13,
      -243.1329473309309,
      "gui",
      "cryos_mini_gui/surfaces/surface_parchment.png",
      32,
      32,
      3,
      3,
      3,
      3
    );
    minimap_bg.scaleX = 12.692302266339293;
    minimap_bg.scaleY = 7.211497012087156;
    minimap_bg.setOrigin(0, 0);
    minimap_container.add(minimap_bg);

    // minimap_border
    const minimap_border = this.add.nineslice(
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
    minimap_container.add(minimap_border);

    // game_actions_container
    const game_actions_container = new GameActions(this, 1280, 2);
    this.add.existing(game_actions_container);

    // resources_container
    const resources_container = new Resources(this, 16, 17);
    this.add.existing(resources_container);

    // actor_info_container
    const actor_info_container = new ActorInfo(this, 1024, 720);
    this.add.existing(actor_info_container);

    // lists
    const hudElements: Array<any> = [];

    this.actor_actions_container = actor_actions_container;
    this.minimap_container = minimap_container;
    this.game_actions_container = game_actions_container;
    this.resources_container = resources_container;
    this.actor_info_container = actor_info_container;
    this.hudElements = hudElements;

    this.events.emit("scene-awake");
  }

  private actor_actions_container!: ActorActions;
  private minimap_container!: Phaser.GameObjects.Container;
  private game_actions_container!: GameActions;
  private resources_container!: Resources;
  private actor_info_container!: ActorInfo;
  private hudElements!: Array<any>;

  /* START-USER-CODE */
  private saveGameSubscription?: Subscription;
  private minimapDiamonds: Phaser.GameObjects.Polygon[] = [];
  private actorDiamonds: Phaser.GameObjects.Polygon[] = [];
  private readonly minimapWidth = 400;
  private readonly smallMinimapWidth = 200;
  private readonly minimapBreakpoint = 800;
  private readonly minimapMargin = 20;
  parentScene?: ProbableWaffleScene;
  private readonly isometricMinimapDepth = 1000;
  preload() {
    this.load.pack("asset-pack-gui", "assets/probable-waffle/asset-packers/asset-pack-probable-waffle-gui.json");
  }

  create() {
    this.editorCreate();

    // resize the scene to match the screen size
    this.scale.on("resize", this.resize, this);
    this.resize({ height: this.scale.height, width: this.scale.width });

    new CursorHandler(this);
    new HudGameState(this);
    new HudElementVisibilityHandler(this, this.hudElements);
    new MultiSelectionHandler(this);
  }

  initializeWithParentScene(parentScene: ProbableWaffleScene) {
    this.parentScene = parentScene;
    this.parentScene.onPostCreate.subscribe(this.postSceneCreate);
    this.subscribeToSaveGameEvent();
  }

  private postSceneCreate = () => {
    this.redrawMinimap();
  };

  private redrawMinimap() {
    if (!this.parentScene) return;
    const tileMapComponent = getSceneComponent(this.parentScene, TilemapComponent);
    if (!tileMapComponent) throw new Error("Tilemap component not found on parent scene");
    const width = tileMapComponent.tilemap.width;
    const sceneWidth = this.scale.width;
    const widthInPixels = sceneWidth > this.minimapBreakpoint ? this.minimapWidth : this.smallMinimapWidth;
    const y = this.scale.height - widthInPixels / 2;
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
    const diamond = this.add.polygon(x + pixelWidth / 2, y + pixelHeight / 2, diamondPoints, color.color);
    diamond.setInteractive(new Phaser.Geom.Polygon(diamondPoints), Phaser.Geom.Polygon.Contains);
    diamond.depth = this.isometricMinimapDepth;
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
    for (let i = 0; i < widthInTiles; i++) {
      for (let j = 0; j < widthInTiles; j++) {
        const tile = layerData[i][j];
        const color = this.getColorFromTiledProperty(tile) ?? Phaser.Display.Color.RandomRGB();
        const isoX = offsetX + (j - i) * (pixelWidth / 2);
        const isoY = (i + j) * (pixelHeight / 2);
        const diamond = this.createDiamondShape(x, y, isoX, isoY, pixelWidth, pixelHeight, color);
        diamond.on("pointerover", (pointer: Phaser.Input.Pointer) => {
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

    if (!this.parentScene) throw new Error("Parent scene not set");
    const tileMapComponent = getSceneComponent(this.parentScene, TilemapComponent);
    if (!tileMapComponent) throw new Error("Tilemap component not found on parent scene");

    const tile = tileMapComponent.tilemap.getTileAt(x, y);
    if (!tile) return null;

    const isoX = (y - x) * (tile.width / 2);
    const isoY = (x + y) * (tile.height / 2);

    return { isoX, isoY };
  }

  private moveCameraToTileCoordinates(tileXY: Vector2Simple) {
    if (!this.parentScene) throw new Error("Parent scene not set");
    const isoCoords = this.getIsometricCoordinates(tileXY);
    if (!isoCoords) return;

    const { isoX, isoY } = isoCoords;
    this.parentScene.cameras.main.pan(isoX, isoY, 50, Phaser.Math.Easing.Quadratic.InOut);
  }

  private assignActorActionToTileCoordinates(tileXY: Vector2Simple) {
    if (!this.parentScene) throw new Error("Parent scene not set");
    const isoCoords = this.getIsometricCoordinates(tileXY);
    if (!isoCoords) return;

    const { isoX, isoY } = isoCoords;
    console.log("Assigning action to tile coordinates", isoX, isoY);
    this.parentScene.events.emit("assignActorActionToTileCoordinates", { x: isoX, y: isoY }); // todo
  }

  private fillMinimapWithActors(widthInPixels: number, widthInTiles: number, x: number, y: number) {
    if (!this.parentScene) throw new Error("Parent scene not set");
    const tileMapComponent = getSceneComponent(this.parentScene, TilemapComponent);
    if (!tileMapComponent) throw new Error("Tilemap component not found on parent scene");

    const height = widthInPixels / 2;
    const pixelWidth = widthInPixels / widthInTiles;
    const pixelHeight = height / widthInTiles;
    const centerX = widthInPixels / 2;
    const offsetX = centerX - pixelWidth / 2;

    this.actorDiamonds.forEach((diamond) => diamond.destroy());
    this.actorDiamonds = [];
    this.parentScene.scene.scene.children.each((child) => {
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

  private resize(gameSize: { height: number; width: number }) {
    this.cameras.resize(gameSize.width, gameSize.height);
    this.updatePositionOfUiElements();
  }

  private updatePositionOfUiElements() {
    // set resources top left
    this.resources_container.x = 10;
    this.resources_container.y = 10;

    // set game actions to top right
    this.game_actions_container.x = this.scale.width - 10;
    this.game_actions_container.y = 10;

    // set minimap to bottom left
    this.minimap_container.x = 0;
    this.minimap_container.y = this.scale.height;

    // set actor actions to bottom right
    this.actor_actions_container.x = this.scale.width;
    this.actor_actions_container.y = this.scale.height;

    // set actor info to bottom center (just left of actor actions)
    const actorActionsWidth = getGameObjectBounds(this.actor_actions_container)!.width;
    this.actor_info_container.x = this.scale.width - actorActionsWidth;
    this.actor_info_container.y = this.scale.height;

    // redraw minimap
    this.redrawMinimap();
  }

  private subscribeToSaveGameEvent() {
    if (!this.parentScene) return;

    this.saveGameSubscription = this.parentScene.communicator.allScenes
      .pipe(filter((value) => value.name === "save-game"))
      .subscribe(() => {
        const text = this.add.text(this.scale.width / 2, this.scale.height / 2, "Game saved", {
          fontSize: "32px",
          color: "#ffffff",
          backgroundColor: "#000000",
          padding: { x: 20, y: 10 }
        });
        text.setOrigin(0.5);
        this.time.delayedCall(500, () => text.destroy());
      });
  }

  destroy() {
    this.saveGameSubscription?.unsubscribe();
    super.destroy();
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
