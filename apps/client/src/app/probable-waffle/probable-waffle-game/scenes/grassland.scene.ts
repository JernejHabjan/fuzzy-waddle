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
    this.load.image('sky', 'https://labs.phaser.io/assets/skies/space3.png');
    this.load.image('logo', 'https://labs.phaser.io/assets/sprites/phaser3-logo.png');
    this.load.image('red', 'https://labs.phaser.io/assets/particles/red.png');

    this.load.atlas(
      'atlas',
      'https://labs.phaser.io/assets/atlas/megaset-2.png',
      'https://labs.phaser.io/assets/atlas/megaset-2.json'
    );

    this.load.image('tiles', 'assets/probable-waffle/tilesets/iso-64x64-outside.png');
    this.load.image('tiles2', 'assets/probable-waffle/tilesets/iso-64x64-building.png');
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

    this.createStartupObjects();
    const { tileMapLayer, mapSizeInfo } = this.createMap();
    this.createObjects();

    this.scaleHandler = new ScaleHandler(this.cameras, this.scale, mapSizeInfo);

    this.input.on(
      Phaser.Input.Events.GAMEOBJECT_DOWN,
      (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        console.log(Phaser.Input.Events.GAMEOBJECT_DOWN, pointer, gameObject);

        this.cameras.main.startFollow(gameObject);
        // todo if (gameObject instanceof BasePortal) {
        // todo   this.hideAllRadiusCircles();
        // todo   gameObject.toggleRadiusVisible(true);
        // todo   this.portalSelectedSubject$.next(gameObject);
        // todo }
      }
    );

    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        console.log('right pointer down');

        this.cameras.main.stopFollow();
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

  private createObjects() {
    const hotdog = this.add.image(100, 200, 'atlas', 'hotdog');
    hotdog.setScale(0.2, 0.2);
  }

  private createStartupObjects() {
    /*this.sky = this.add.image(
     this.scale.width / 2,
     this.scale.height / 2,
     'sky'
   );
   this.sky.setScale(4, 4);*/

    const particles = this.add.particles('red');

    const emitter = particles.createEmitter({
      speed: 100,
      scale: { start: 1, end: 0 },
      blendMode: 'ADD'
    });

    this.logo = this.physics.add.image(0, 0, 'logo');
    // input enabled
    this.logo.setInteractive({ cursor: CursorHandler.penCursor });

    this.logo.setVelocity(100, 200);
    this.logo.setBounce(1, 1);
    this.logo.setCollideWorldBounds(true);

    emitter.startFollow(this.logo);
  }
}
