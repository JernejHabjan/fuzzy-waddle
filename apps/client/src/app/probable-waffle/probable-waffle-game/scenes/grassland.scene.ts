import * as Phaser from 'phaser';
import { Scenes } from './scenes';
import { SceneCommunicatorService } from '../event-emitters/scene-communicator.service';
import { CreateSceneFromObjectConfig } from '../interfaces/scene-config.interface';
import { InputHandler } from '../input/input.handler';
import { ScaleHandler } from '../scale/scale.handler';
import { MapSizeInfo } from '../const/map-size.info';
import { CursorHandler } from '../input/cursor.handler';
import { TilemapInputHandler } from '../input/tilemap/tilemap-input.handler';

export default class GrasslandScene extends Phaser.Scene implements CreateSceneFromObjectConfig {
  private logo!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private inputHandler!: InputHandler;
  private scaleHandler!: ScaleHandler;
  private cursorHandler!: CursorHandler;
  private tilemapInputHandler!: TilemapInputHandler;

  constructor() {
    super({ key: Scenes.GrasslandScene });
  }

  preload() {
    this.load.atlas(
      'atlas',
      'assets/probable-waffle/atlas/megaset-2.png',
      'assets/probable-waffle/atlas/megaset-2.json'
    );

    this.load.image('tiles', 'assets/probable-waffle/atlas/iso-64x64-outside.png');
    this.load.image('tiles2', 'assets/probable-waffle/atlas/iso-64x64-building.png');
    this.load.tilemapTiledJSON('map', 'assets/probable-waffle/tilemaps/start-small.json');

    // big map
    // this.load.tilemapTiledJSON('map', 'https://labs.phaser.io/assets/tilemaps/iso/isorpg.json');
  }

  create() {
    SceneCommunicatorService.subscriptions.push(
      SceneCommunicatorService.testEmitterSubject.subscribe((nr) => {
        console.log('event received', nr);
        // this.logo.setVelocity(100 * nr, 200 * nr);
      })
    );

    this.cameras.main.setZoom(2);

    const { tileMapLayer, mapSizeInfo } = this.createMap();

    this.placeObjectOnTilemapTile(tileMapLayer.getTileAt(2, 2), mapSizeInfo);

    this.input.on(
      Phaser.Input.Events.GAMEOBJECT_DOWN,
      (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        console.log(Phaser.Input.Events.GAMEOBJECT_DOWN, pointer, gameObject);

        if (gameObject instanceof Phaser.GameObjects.Sprite || gameObject instanceof Phaser.GameObjects.Image) {
          gameObject.setTint(0xff0000);
        }
      }
    );

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        console.log('right pointer down');

        // this.cameras.main.stopFollow();
      }
    });

    this.input.on(
      Phaser.Input.Events.GAME_OUT,
      () => {
        // todo if (this.portalPlaceholder) {
        // todo   this.hidePortalPlaceholder();
        // todo }
      },
      this
    );

    this.scaleHandler = new ScaleHandler(this.cameras, this.scale, mapSizeInfo);
    this.inputHandler = new InputHandler(this.input, this.cameras.main);
    this.cursorHandler = new CursorHandler(this.input);
    this.tilemapInputHandler = new TilemapInputHandler(this.input, tileMapLayer, mapSizeInfo);
    this.destroyListener();
  }

  hidePortalPlaceholder(): void {
    // todo this.portalPlaceholder.destroyEnemy();
    // todo this.portalPlaceholder = null;
    // todo this.portalElementSelectedSubject$.next(null);
  }

  hideAllRadiusCircles(): void {
    // todo this.activeBuildings?.forEach(portal => portal.toggleRadiusVisible(false));
  }

  private createMap(): {
    tileMapLayer: Phaser.Tilemaps.TilemapLayer;
    mapSizeInfo: MapSizeInfo;
  } {
    const map = this.add.tilemap('map');

    // console.log(map);

    const tileset1 = map.addTilesetImage('iso-64x64-outside', 'tiles') as Phaser.Tilemaps.Tileset;
    const tileset2 = map.addTilesetImage('iso-64x64-building', 'tiles2') as Phaser.Tilemaps.Tileset;

    const tileMapLayer = map.createLayer('Tile Layer 1', [tileset1, tileset2]) as Phaser.Tilemaps.TilemapLayer;
    return {
      tileMapLayer,
      mapSizeInfo: new MapSizeInfo(map.width, map.height, map.tileWidth, map.tileHeight)
    };
  }

  override update(time: number, delta: number) {
    super.update(time, delta);
    this.inputHandler.update(time, delta);
  }

  private destroyListener() {
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE);
      this.input.off(Phaser.Input.Events.GAMEOBJECT_DOWN);
      this.input.off(Phaser.Input.Events.POINTER_DOWN);
      this.input.off(Phaser.Input.Events.GAME_OUT);
      this.input.off(Phaser.Input.Events.POINTER_WHEEL);
      this.inputHandler.destroy();
      this.scaleHandler.destroy();
      this.cursorHandler.destroy();
      this.tilemapInputHandler.destroy();
    });
  }

  private placeObjectOnTilemapTile(tile: Phaser.Tilemaps.Tile, mapSizeInfo: MapSizeInfo) {
    // get coordinates of tile
    const centerX = tile.getCenterX();
    const centerY = tile.getCenterY() - mapSizeInfo.tileHeight / 2; // note this offset

    // create object
    const hotDog = this.add.image(centerX, centerY, 'atlas', 'hotdog');
    hotDog.setInteractive();
    hotDog.setScale(0.2, 0.2);
  }
}
