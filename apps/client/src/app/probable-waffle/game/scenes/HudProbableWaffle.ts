// You can write more code here

/* START OF COMPILED CODE */

import ButtonSmall from "../prefabs/gui/buttons/ButtonSmall";
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { HudGameState } from "../hud/hud-game-state";
import { HudElementVisibilityHandler } from "../hud/hud-element-visibility.handler";
import { CursorHandler } from "../world/managers/controllers/input/cursor.handler";
import { MultiSelectionHandler } from "../world/managers/controllers/input/multi-selection.handler";
import { Subscription } from "rxjs";
import { GameSessionState, Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { SaveGame } from "../data/save-game";
import { onScenePostCreate } from "../data/game-object-helper";
import { getSceneComponent } from "./components/scene-component-helpers";
import { TilemapComponent } from "./components/tilemap.component";
import { getActorComponent } from "../data/actor-component";
import { ColliderComponent } from "../entity/actor/components/collider-component";
import { getTileCoordsUnderObject } from "../library/tile-under-object";
/* END-USER-IMPORTS */

export default class HudProbableWaffle extends ProbableWaffleScene {
  private minimapDiamonds: Phaser.GameObjects.Polygon[] = [];
  private actorDiamonds: Phaser.GameObjects.Polygon[] = [];
  private readonly minimapWidth = 400;
  private readonly smallMinimapWidth = 200;
  private readonly minimapBreakpoint = 800;
  private readonly minimapMargin = 20;
  constructor() {
    super("HudProbableWaffle");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // buttonSave
    const buttonSave = new ButtonSmall(this, 1180, 38);
    this.add.existing(buttonSave);

    // buttonQuit
    const buttonQuit = new ButtonSmall(this, 1201, 38);
    this.add.existing(buttonQuit);

    // lists
    const hudElements: Array<any> = [];

    // buttonSave (prefab fields)
    buttonSave.text = "S";
    buttonSave.w = 45;
    buttonSave.h = 45;
    buttonSave.fontSize = 30;

    // buttonQuit (prefab fields)
    buttonQuit.text = "Q";
    buttonQuit.w = 45;
    buttonQuit.h = 45;
    buttonQuit.fontSize = 30;

    this.buttonSave = buttonSave;
    this.buttonQuit = buttonQuit;
    this.hudElements = hudElements;

    this.events.emit("scene-awake");
  }

  private buttonSave!: ButtonSmall;
  private buttonQuit!: ButtonSmall;
  private hudElements!: Array<any>;

  /* START-USER-CODE */
  private quitButtonSubscription?: Subscription;
  private saveGameSubscription?: Subscription;
  private parentScene?: ProbableWaffleScene;
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
    this.handleQuit();
    this.handleSaveGame();
    this.handleButtonVisibility();
  }

  initializeWithParentScene(parentScene: ProbableWaffleScene) {
    this.parentScene = parentScene;
    onScenePostCreate(parentScene, this.postSceneCreate, this);
  }

  private postSceneCreate() {
    this.redrawMinimap();
  }

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
      const colliderComponent = getActorComponent(child, ColliderComponent);
      if (!colliderComponent) return;

      const tilesUnderObject: Vector2Simple[] = getTileCoordsUnderObject(tileMapComponent.tilemap, child);
      const color = Phaser.Display.Color.RandomRGB();

      for (const tile of tilesUnderObject) {
        const isoX = offsetX + (tile.x - tile.y) * (pixelWidth / 2);
        const isoY = (tile.x + tile.y) * (pixelHeight / 2);
        const diamond = this.createDiamondShape(x, y, isoX, isoY, pixelWidth, pixelHeight, color);
        this.actorDiamonds.push(diamond);
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
    // push button to top right (margin 40px)
    this.buttonQuit.x = this.scale.width - this.buttonQuit.w - 40;
    this.buttonQuit.y = 40;

    // set save button to the left of quit button by 20px
    this.buttonSave.x = this.buttonQuit.x - this.buttonSave.w - 40;
    this.buttonSave.y = this.buttonQuit.y;

    // redraw minimap
    this.redrawMinimap();
  }

  private handleQuit() {
    this.quitButtonSubscription = this.buttonQuit.clicked.subscribe(() => {
      // todo rather than this, change the player state session state to "to score screen" because only 1 player quits
      this.communicator.gameInstanceMetadataChanged?.send({
        property: "sessionState",
        gameInstanceId: this.baseGameData.gameInstance.gameInstanceMetadata.data.gameInstanceId!,
        data: { sessionState: GameSessionState.ToScoreScreen },
        emitterUserId: this.baseGameData.user.userId
      });
    });
  }

  private handleSaveGame() {
    this.saveGameSubscription = this.buttonSave.clicked.subscribe(() => {
      this.communicator.allScenes.emit({ name: SaveGame.SaveGameEvent });
    });
  }

  destroy() {
    this.quitButtonSubscription?.unsubscribe();
    this.saveGameSubscription?.unsubscribe();
    super.destroy();
  }
  get isVisibleSaveButton() {
    return !this.baseGameData.gameInstance.gameInstanceMetadata.isReplay();
  }

  private handleButtonVisibility() {
    const saveButtonVisibile = this.isVisibleSaveButton;
    this.buttonSave.visible = saveButtonVisibile;
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
