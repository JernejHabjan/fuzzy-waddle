import * as Phaser from 'phaser';
import { Scenes } from './scenes';
import { SceneCommunicatorService } from '../event-emitters/scene-communicator.service';
import { CreateSceneFromObjectConfig } from '../interfaces/scene-config.interface';

export default class GrasslandScene
  extends Phaser.Scene
  implements CreateSceneFromObjectConfig
{
  private logo!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private sky!: Phaser.GameObjects.Image;
  private origDragPoint: Phaser.Math.Vector2 | null = null;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys |null = null;

  constructor() {
    super({ key: Scenes.GrasslandScene });
  }

  preload() {
    this.load.image('sky', 'https://labs.phaser.io/assets/skies/space3.png');
    this.load.image('logo', 'https://labs.phaser.io/assets/sprites/phaser3-logo.png');
    this.load.image('red', 'https://labs.phaser.io/assets/particles/red.png');

    this.load.atlas('atlas', 'https://labs.phaser.io/assets/atlas/megaset-2.png', 'https://labs.phaser.io/assets/atlas/megaset-2.json');


    this.load.image('tiles', 'assets/probable-waffle/tilesets/iso-64x64-outside.png');
    this.load.image('tiles2', 'assets/probable-waffle/tilesets/iso-64x64-building.png');
    this.load.tilemapTiledJSON('map', 'assets/probable-waffle/tilemaps/start-small.json');

    // big map
    // this.load.tilemapTiledJSON('map', 'https://labs.phaser.io/assets/tilemaps/iso/isorpg.json');

  }

  create() {
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
    this.logo.setInteractive();

    this.logo.setVelocity(100, 200);
    this.logo.setBounce(1, 1);
    this.logo.setCollideWorldBounds(true);

    this.cursors = this.input.keyboard?.createCursorKeys() ?? null;

    emitter.startFollow(this.logo);

    SceneCommunicatorService.subscriptions.push(
      SceneCommunicatorService.testEmitterSubject.subscribe((nr) => {
        console.log('event received', nr);
        this.logo.setVelocity(100 * nr, 200 * nr);
      })
    );

    // this.cameras.main.setZoom(1.5);
    // this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);

    this.scale.on(Phaser.Scale.Events.RESIZE, this.resize, this);


    const map = this.add.tilemap('map');

    // console.log(map);

    const tileset1 = map.addTilesetImage('iso-64x64-outside', 'tiles') as Phaser.Tilemaps.Tileset;
    const tileset2 = map.addTilesetImage('iso-64x64-building', 'tiles2') as Phaser.Tilemaps.Tileset;

    const layer1 = map.createLayer('Tile Layer 1', [ tileset1, tileset2 ]);
    // const layer2 = map.createLayer('Tile Layer 2', [ tileset1, tileset2 ]);
    // const layer3 = map.createLayer('Tile Layer 3', [ tileset1, tileset2 ]);
    // const layer4 = map.createLayer('Tile Layer 4', [ tileset1, tileset2 ]);
    // const layer5 = map.createLayer('Tile Layer 5', [ tileset1, tileset2 ]);


    const hotdog = this.add.image(100, 200, 'atlas','hotdog');
    hotdog.setScale(0.2, 0.2);

    this.input.on(Phaser.Input.Events.GAMEOBJECT_DOWN,
      (
        pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject
      ) => {
        console.log(Phaser.Input.Events.GAMEOBJECT_DOWN, pointer, gameObject);

        this.cameras.main.startFollow(gameObject);
        // todo if (gameObject instanceof BasePortal) {
        // todo   this.hideAllRadiusCircles();
        // todo   gameObject.toggleRadiusVisible(true);
        // todo   this.portalSelectedSubject$.next(gameObject);
        // todo }
      }
    );

    this.input.on(Phaser.Input.Events.POINTER_DOWN,
      (pointer: Phaser.Input.Pointer) => {
        if (pointer.rightButtonDown()) {
          console.log('right pointer down');

          this.cameras.main.stopFollow();
        }
      }
    );

    this.input.on(Phaser.Input.Events.GAME_OUT,
      () => {
        // todo if (this.portalPlaceholder) {
        // todo   this.hidePortalPlaceholder();
        // todo }
      },
      this
    );

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE);
      this.input.off(Phaser.Input.Events.GAMEOBJECT_DOWN);
      this.input.off(Phaser.Input.Events.POINTER_DOWN);
      this.input.off(Phaser.Input.Events.GAME_OUT);
    });
  }

  hidePortalPlaceholder(): void {
    // todo this.portalPlaceholder.destroyEnemy();
    // todo this.portalPlaceholder = null;
    // todo this.portalElementSelectedSubject$.next(null);
  }

  hideAllRadiusCircles(): void {
    // todo this.activeBuildings?.forEach(portal => portal.toggleRadiusVisible(false));
  }

  /**
   * * When the screen is resized, we
   *
   * @param gameSize
   */
  private resize(gameSize: Phaser.Structs.Size): void {
    console.log('Resizing', gameSize.width, gameSize.height);
    this.cameras.resize(gameSize.width, gameSize.height);
    this.sky.setPosition(gameSize.width / 2, gameSize.height / 2);
    this.physics.world.setBounds(0, 0, gameSize.width, gameSize.height);
    this.cameras.main.setBounds(0, 0, gameSize.width, gameSize.height);
  }

  override update(time: number, delta: number) {
    super.update(time, delta);
    this.updateCamera(); // todo update camera on event tick?
    // todo update-camera https://phaser.io/examples/v3/view/game-objects/dom-element/move-camera
  }

  private updateCamera() {
    if (this.input.activePointer.isDown) {
      if (this.input.activePointer.rightButtonDown()) {
        // console.log('right button down');
      } else {
        if (this.origDragPoint) {
          // move the camera by the amount the mouse has moved since last update
          this.cameras.main.scrollX +=
            this.origDragPoint.x - this.input.activePointer.position.x;
          this.cameras.main.scrollY +=
            this.origDragPoint.y - this.input.activePointer.position.y;
        } // set new drag origin to current position
        this.origDragPoint = this.input.activePointer.position.clone();
      }
    } else {
      this.origDragPoint = null;
    }

    if (!this.input.activePointer.isDown) {
      const arrowMove = 20;
      if (this.cursors?.up.isDown) {
        this.cameras.main.scrollY -= arrowMove;
      } else if (this.cursors?.down.isDown) {
        this.cameras.main.scrollY += arrowMove;
      }

      if (this.cursors?.left.isDown) {
        this.cameras.main.scrollX -= arrowMove;
      } else if (this.cursors?.right.isDown) {
        this.cameras.main.scrollX += arrowMove;
      }
    }
  }
}
