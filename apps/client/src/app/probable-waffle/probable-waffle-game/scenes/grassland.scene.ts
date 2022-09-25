import * as Phaser from 'phaser';
import { Scenes } from './scenes';
import { SceneCommunicatorService } from '../event-emitters/scene-communicator.service';
import { CreateSceneFromObjectConfig } from '../interfaces/scene-config.interface';
import { InputHandler } from '../input/input.handler';
import { ScaleHandler } from '../scale/scale.handler';
import { MapSizeInfo } from '../const/map-size.info';
import { CursorHandler } from '../input/cursor.handler';
import { TilemapInputHandler } from '../input/tilemap/tilemap-input.handler';
import { TileCenterOptions } from '../types/tile-types';

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
      'assets/probable-waffle/atlas/megaset-0.png',
      'assets/probable-waffle/atlas/megaset-0.json'
    );

    this.load.image('tiles', 'assets/probable-waffle/atlas/iso-64x64-outside.png');
    this.load.image('tiles2', 'assets/probable-waffle/atlas/iso-64x64-building.png');
    this.load.tilemapTiledJSON('map', 'assets/probable-waffle/tilemaps/start-small.json');

    this.load.atlas(
      'iso-64x64-building-atlas',
      'assets/probable-waffle/atlas/iso-64x64-building.png',
      'assets/probable-waffle/atlas/iso-64x64-building.json'
    );

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

    this.createLayer(mapSizeInfo, 0); // layer 0
    this.createLayer(mapSizeInfo, 1); // layer 1

    this.placeSpriteOnTilemapTile(tileMapLayer.getTileAt(0, 0), mapSizeInfo);

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

  private placeSpriteOnTilemapTile(tile: Phaser.Tilemaps.Tile, mapSizeInfo: MapSizeInfo) {
    const tileCenter = this.getTileCenter(tile.getCenterX(), tile.getCenterY(), mapSizeInfo, { centerSprite: true });

    // create object
    const sprite = this.add.image(tileCenter.x, tileCenter.y, 'atlas', 'blue_ball');
    // todo set object depth!
    sprite.setInteractive();
    // todo temp
    sprite.setScale(1, 1);
  }

  private getTileCenter(
    x: number,
    y: number,
    mapSizeInfo: MapSizeInfo,
    tileCenterOptions: TileCenterOptions = null
  ): Phaser.Math.Vector2 {
    const centerX = x;
    const centerY =
      y +
      (tileCenterOptions?.offset
        ? -tileCenterOptions.offset
        : tileCenterOptions?.centerSprite
        ? mapSizeInfo.tileHeight / 2
        : 0);
    return new Phaser.Math.Vector2(centerX, centerY);
  }

  private createLayer(mapSizeInfo: MapSizeInfo, layer: number) {
    const layerOffset = layer * mapSizeInfo.tileHeight;
    const tileWidth = mapSizeInfo.tileWidth;
    const tileHeight = mapSizeInfo.tileHeight;

    const tileWidthHalf = tileWidth / 2;
    const tileHeightHalf = tileHeight / 2;

    const mapWidth = mapSizeInfo.width;
    const mapHeight = mapSizeInfo.height;

    // not offsetting, because we're placing block tiles there
    const tileCenter = this.getTileCenter(mapSizeInfo.tileWidth / 2, mapSizeInfo.tileWidth / 2, mapSizeInfo, {
      offset: layerOffset
    });

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const tx = (x - y) * tileWidthHalf;
        const ty = (x + y) * tileHeightHalf;

        const tile = this.add.image(
          tileCenter.x + tx,
          tileCenter.y + ty,
          'iso-64x64-building-atlas',
          'iso-64x64-building-0'
        );
        // todo temp
        //tile.setScale(0.2, 0.2);

        tile.depth = tileCenter.y + ty + layerOffset;
      }
    }
  }
}
