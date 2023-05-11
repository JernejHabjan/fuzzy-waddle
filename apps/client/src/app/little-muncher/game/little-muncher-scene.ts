import { Scenes } from './const/scenes';
import {
  LittleMuncherGameMode,
  LittleMuncherGameModeData,
  LittleMuncherGameState,
  LittleMuncherGameStateData,
  LittleMuncherPlayer,
  LittleMuncherPlayerControllerData,
  LittleMuncherPlayerStateData,
  LittleMuncherSpectator,
  LittleMuncherSpectatorData
} from '@fuzzy-waddle/api-interfaces';
import BaseScene from '../../shared/game/phaser/scene/base.scene';
import { LittleMuncherGameData } from './little-muncher-game-data';
import { Pause } from './pause';
import { PlayerInputController } from './player-input-controller';

export default class LittleMuncherScene extends BaseScene<
  LittleMuncherGameData,
  LittleMuncherGameStateData,
  LittleMuncherGameState,
  LittleMuncherGameModeData,
  LittleMuncherGameMode,
  LittleMuncherPlayerStateData,
  LittleMuncherPlayerControllerData,
  LittleMuncherPlayer,
  LittleMuncherSpectatorData,
  LittleMuncherSpectator
> {
  private playerInputController!: PlayerInputController;

  private readonly initialWorldSpeed = 3;
  private readonly maxWorldSpeed = this.initialWorldSpeed * 3;
  private readonly maxCharacterHealth = 30;
  private readonly powerUpDuration = 2000;
  private readonly objectVelocity = 100;
  private readonly objectMaxVelocity = this.objectVelocity * 3;
  private worldWidth!: number;
  private readonly objectMargin = 100;
  private readonly objectDestroyMargin = 200;

  private worldSpeed = this.initialWorldSpeed; // pixels per frame
  private objectGroup: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] = [];
  private nonCollidableGroup: Phaser.Physics.Arcade.Sprite[] = [];
  private character!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private objectSpawnTimer!: Phaser.Time.TimerEvent;
  private powerUpSpawnTimer!: Phaser.Time.TimerEvent;
  private characterHealth = this.maxCharacterHealth;
  private healthDisplayText!: Phaser.GameObjects.Text;
  private characterSpeed = 2; // the speed at which the character moves
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys; // variable to store the cursor keys
  private background!: Phaser.GameObjects.TileSprite;
  private gameOverFlag = false;
  private poweredUp: Date | null = null;
  private objectScale = -1;
  private swipeInput!: any;
  private viewPortX!: number;

  constructor() {
    super({ key: Scenes.MainScene });
  }

  override get playerOrNull(): LittleMuncherPlayer | null {
    // there can only be 1 player in little muncher
    if (!this.baseGameData.gameInstance.players.length) return null;
    return this.baseGameData.gameInstance.players[0];
  }

  override preload() {
    super.preload();
    this.load.multiatlas(
      'lm-atlas',
      'assets/little-muncher/spritesheets/little-muncher-spritesheet.json',
      'assets/little-muncher/spritesheets'
    );
    this.load.audio('hit', 'assets/probable-waffle/sfx/character/death/death1.mp3');
    this.load.audio('bird', 'assets/little-muncher/sfx/bird.mp3');
    this.load.scenePlugin({
      key: 'rexgesturesplugin',
      url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexgesturesplugin.min.js',
      sceneKey: 'rexGestures'
    });
  }

  override init() {
    super.init();
    new Pause(this);
    this.playerInputController = new PlayerInputController(this);
    // todo new Fireworks(this); // todo it must be here until we rework registration engine
  }

  override create() {
    super.create();
    this.setViewport();
    this.drawBackground();

    this.swipeInput = (this as any).rexGestures.add.swipe({ velocityThreshold: 1000 });

    // bind resize event
    this.subscribe(
      this.onResize.subscribe(() => {
        this.setViewport();
        this.setBackgroundSize();
        this.handleResizeCharacter();
        this.objectGroup.forEach((o) => o.setScale(this.objectScale));
        this.nonCollidableGroup.forEach((o) => o.setScale(this.objectScale));
      })
    );

    this.createAnims();
    this.createCharacter();
    this.playerInputController.init(this.character);

    console.log('hill to climb on:', this.gameMode.data.hill);
    console.log('time climbing:', this.gameState.data.timeClimbing);
    console.log('should be paused:', this.gameState.data.pause);

    this.communicator.score?.send({ score: Math.round(Math.random() * 100) }); // todo just for testing

    this.setupTimers();
  }

  private setViewport() {
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    this.worldWidth = screenWidth > 800 ? 800 : screenWidth;
    this.objectScale = screenWidth > 800 ? 2 : 1.5;

    this.viewPortX = screenWidth / 2 - this.worldWidth / 2;

    this.cameras.main.setViewport(this.viewPortX, 0, this.worldWidth, screenHeight);

    // Set the physics world bounds to match the camera's bounds
    this.physics.world.setBounds(0, 0, this.worldWidth, this.cameras.main.height);
  }

  private createCharacterAnim(end: number, prefix: string) {
    return this.anims.generateFrameNames('lm-atlas', { start: 1, end, prefix });
  }

  private createAnims = () => {
    const characterDeath = this.createCharacterAnim(6, 'character/death/');
    const characterVictoryFront = this.createCharacterAnim(6, 'character/victory/front/');
    const characterVictoryBack = this.createCharacterAnim(6, 'character/victory/back/');
    const characterWalkBack = this.createCharacterAnim(9, 'character/walk/back/');
    const characterWalkFront = this.createCharacterAnim(9, 'character/walk/front/');
    const characterWalkLeft = this.createCharacterAnim(9, 'character/walk/left/');
    const characterWalkRight = this.createCharacterAnim(9, 'character/walk/right/');
    const characterIdleBack = this.createCharacterAnim(1, 'character/idle/');
    const characterIdleFront = this.createCharacterAnim(2, 'character/idle/');
    const characterIdleLeft = this.createCharacterAnim(3, 'character/idle/');
    const characterIdleRight = this.createCharacterAnim(4, 'character/idle/');

    const birdIdle = this.anims.generateFrameNames('lm-atlas', { prefix: 'bird/', frames: [1, 0, 2, 0] });
    const birdIdleFlap = this.anims.generateFrameNames('lm-atlas', { prefix: 'bird/', frames: [1, 3, 4, 3] });
    const birdFlyOff = this.anims.generateFrameNames('lm-atlas', { prefix: 'bird/', frames: [1, 3, 4, 5, 6, 7] });
    const birdFly = this.anims.generateFrameNames('lm-atlas', { prefix: 'bird/', frames: [8, 9] });

    // create anims for the character
    this.anims.create({ key: 'character-death', frames: characterDeath, frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'character-victory-front', frames: characterVictoryFront, frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'character-victory-back', frames: characterVictoryBack, frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'character-walk-back', frames: characterWalkBack, frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'character-walk-front', frames: characterWalkFront, frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'character-walk-left', frames: characterWalkLeft, frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'character-walk-right', frames: characterWalkRight, frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'character-idle-back', frames: characterIdleBack, frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'character-idle-front', frames: characterIdleFront, frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'character-idle-left', frames: characterIdleLeft, frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'character-idle-right', frames: characterIdleRight, frameRate: 10, repeat: -1 });

    // create anims for the bird
    this.anims.create({ key: 'bird-idle', frames: birdIdle, frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'bird-idle-flap', frames: birdIdleFlap, frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'bird-fly-off', frames: birdFlyOff, frameRate: 10, repeat: 0 });
    this.anims.create({ key: 'bird-fly', frames: birdFly, frameRate: 10, repeat: -1 });
  };

  private drawBackground = () => {
    this.background = this.add.tileSprite(0, 0, 0, 0, 'lm-atlas', 'background');
    this.background.setScrollFactor(0); // make the background stationary
    this.background.setOrigin(0, 0); // set the origin of the sprite to the top-left corner
    this.background.setSize(this.worldWidth, this.cameras.main.height);
    this.background.setDepth(-1);
  };
  private setBackgroundSize = () => {
    this.background.setSize(this.worldWidth, this.cameras.main.height);
  };

  private createCharacter = () => {
    // create the character sprite
    this.character = this.physics.add.sprite(0, 0, 'lm-atlas', 'character/idle/1');
    this.handleResizeCharacter();
    this.character.anims.play('character-walk-back', true);

    // set the character's size and physics properties
    this.character.setCollideWorldBounds(true);

    // create the cursor keys
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    this.updateHealthDisplay();
  };

  private handleResizeCharacter = () => {
    const height = this.cameras.main.height;
    // set y to first 1/8 from bottom up
    const y = height - height / 8;
    this.character.setPosition(this.cameras.main.width / 2, y);

    this.character.setScale(this.objectScale);
  };

  override update(time: number, delta: number) {
    super.update(time, delta);

    if (this.gameOverFlag) return;
    this.handleCharacterMovement();

    // move world objects down
    this.objectGroup.forEach((sprite) => {
      const bounced = sprite.getData('bounced'); // todo static type
      if (!bounced) {
        sprite.y += this.worldSpeed;
      }
    });
    this.nonCollidableGroup.forEach((sprite: Phaser.Physics.Arcade.Sprite) => {
      sprite.y += this.worldSpeed;
    });

    this.background.tilePositionY -= this.worldSpeed;

    // check for collision with random objects
    this.physics.overlap(this.character, this.objectGroup, this.objectCollisionHandler);

    // dispose of objects that have gone off-screen
    this.objectGroup.forEach((object) => this.destroyOffScreenSprite(this.objectGroup, object));
    this.nonCollidableGroup.forEach((object) => this.destroyOffScreenSprite(this.nonCollidableGroup, object));

    this.handlePowerUpUpdate(time, delta);
  }

  private destroyOffScreenSprite = (group: Phaser.Physics.Arcade.Sprite[], sprite: Phaser.Physics.Arcade.Sprite) => {
    const camera = this.cameras.main;
    const zoom = camera.zoom;
    const height = camera.height;
    const width = camera.width;
    const y = sprite.y;
    const x = sprite.x;
    const margin = this.objectMargin * zoom + this.objectDestroyMargin;

    const overTop = y < -margin;
    const overBottom = y > height + margin;
    const overLeft = x < -margin;
    const overRight = x > width + margin;

    if (overTop || overBottom || overLeft || overRight) {
      sprite.destroy();
      // remove the sprite from the group
      group.splice(group.indexOf(sprite), 1);
    }
  };

  private handlePowerUpUpdate = (time: number, delta: number) => {
    if (!this.poweredUp) return;
    const now = new Date();
    if (now.getTime() - this.poweredUp.getTime() > this.powerUpDuration) {
      this.setupPowerUp(false);
    }
  };

  private handleCharacterMovement = () => {
    if (!this.cursors) {
      this.handleSwipe();
      return;
    }
    // move the character left or right based on the arrow keys
    if (this.cursors.left.isDown) {
      // move left
      this.character.anims.play('character-walk-left', true);
      this.character.x -= this.characterSpeed * this.worldSpeed;
    } else if (this.cursors.right.isDown) {
      // move right
      this.character.anims.play('character-walk-right', true);
      this.character.x += this.characterSpeed * this.worldSpeed;
    } else {
      this.character.anims.play('character-walk-back', true);
    }
  };

  private handleSwipe() {
    if (!this.swipeInput.isSwiped) return;
    // https://codepen.io/rexrainbow/pen/joWZbw

    // check if character is on left or right side of screen or middle
    // if on left, only allow right swipe
    // if on right, only allow left swipe
    const x = Math.round(this.character.x);
    const isCharacterOnLeftSideOfScreen = x < this.worldWidth / 2;
    const isCharacterOnRightSideOfScreen = x > this.worldWidth / 2;

    if (this.swipeInput.left) {
      if (isCharacterOnRightSideOfScreen) return;
      // move character left by 1/3 of screen
      this.character.x += this.worldWidth / 3;
    } else if (this.swipeInput.right) {
      if (isCharacterOnLeftSideOfScreen) return;
      // move character right by 1/3 of screen
      this.character.x -= this.worldWidth / 3;
    }
  }

  spawnObject = (key: string, name: 'obstacle' | 'powerUp') => {
    // todo enum

    let x = Math.random() * this.worldWidth;
    const y = -this.objectMargin;

    const keyboardEnabled = !!this.cursors;

    if (!keyboardEnabled) {
      // spawn object in one of 3 columns
      const column = Math.floor(Math.random() * 3);
      const columnWidth = this.worldWidth / 3;
      x = column * columnWidth + columnWidth / 2;
    }

    const object = this.physics.add.sprite(x, y, 'lm-atlas', key);
    object.setScale(this.objectScale);
    const objectBounds = object.getBounds();

    // ensure the object is not spawned on top of other objects, if it is, destroy it
    let wouldOverlap = false;
    this.objectGroup.forEach((existingObject) => {
      const existingObjectBounds = existingObject.getBounds();
      if (Phaser.Geom.Intersects.RectangleToRectangle(objectBounds, existingObjectBounds)) {
        wouldOverlap = true;
      }
    });
    if (wouldOverlap) {
      object.destroy(true);
      return;
    }

    if (key === 'tree') {
      this.spawnBird(object);
    }
    object.setData('type', key);
    this.objectGroup.push(object);
    object.name = name;
  };

  private spawnBird = (object: Phaser.Physics.Arcade.Sprite) => {
    if (Math.random() > 0.3) return; // 30% chance of spawning a bird

    const bird = this.physics.add.sprite(object.x, object.y - 40 * object.scale, 'lm-atlas', 'bird/0');
    bird.setDepth(1);
    bird.anims.play('bird-idle', true);
    object.setScale(this.objectScale);
    bird.setOrigin(0.5, 0.5);
    object.setData('bird', bird);
    this.nonCollidableGroup.push(bird);
  };

  private objectCollisionHandler = (characterIn: any, objectIn: any) => {
    const character = characterIn as Phaser.Physics.Arcade.Sprite;
    const object = objectIn as Phaser.Physics.Arcade.Sprite;
    // remove the object from the group

    // do something based on the type of object collided with
    if (object.name === 'powerUp') {
      // todo to enum
      // add a powerup to the character
      this.setupPowerUp(true);
      object.destroy();
    } else if (object.name === 'obstacle') {
      if (!object.getData('bounced')) {
        this.manageBirdOnTreeCollision(object);

        if (this.poweredUp && object.getData('type') !== 'tree') {
          // bounce the object
          const randomVelocityBetween4And5 = Math.random() + 4;
          object.body!.velocity.y = -this.objectVelocity * randomVelocityBetween4And5;
          object.setData('bounced', true); // todo static type
        } else {
          this.crashCharacter(character, object);
        }
      }
    } else {
      // do nothing
    }
  };

  private manageBirdOnTreeCollision = (object: Phaser.Physics.Arcade.Sprite) => {
    if (object.getData('type') !== 'tree') return;
    // get bird
    const bird = object.getData('bird');
    if (!bird) return;
    // set random x,y velocity, but only up
    const birdVelocity = this.objectVelocity;
    const birdXVelocity = Math.random() * 2 * birdVelocity - birdVelocity;
    const birdYVelocity = -Math.random() * 2 * birdVelocity;
    bird.setVelocityX(birdXVelocity * 4);
    bird.setVelocityY(birdYVelocity * 4);
    // play sound effect
    this.sound.play('bird');

    // set bird animation

    const flyOffAnim = bird.play('bird-fly-off', true);
    // when the animation ends, play different animation
    flyOffAnim.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      bird?.play('bird-fly', true);
    });
  };

  private readonly crashCharacter = (character: Phaser.Physics.Arcade.Sprite, object: Phaser.Physics.Arcade.Sprite) => {
    // todo to enum
    object.destroy(true);
    // todo play explosion animation
    this.sound.play('hit');
    // shake screen
    this.cameras.main.shake(100, 0.003);

    if (this.poweredUp) {
      return;
    }
    // reduce the character's health
    this.characterHealth -= 10;
    character.tint = 0xff0000;
    // play sound effect
    setTimeout(() => {
      character.clearTint();
    }, 100);
    this.updateHealthDisplay();
    if (this.characterHealth <= 0) {
      // game over
      this.gameOver();
      character.tint = 0xff0000;
    }
  };

  private setupPowerUp(poweredUp: boolean) {
    if (poweredUp) {
      this.poweredUp = new Date();
      this.worldSpeed = Math.min(this.worldSpeed * 2, this.maxWorldSpeed);
    } else {
      this.poweredUp = null;
      this.worldSpeed = this.initialWorldSpeed;
    }
  }

  private updateHealthDisplay = () => {
    // remove the old health display text, if it exists
    if (this.healthDisplayText) {
      this.healthDisplayText.destroy();
    }

    // create a new health display text object
    const healthDisplayString = 'Health: ' + this.characterHealth;
    this.healthDisplayText = this.add.text(100, 100, healthDisplayString, { font: '32px Arial', color: '#000000' });
  };

  private gameOver = () => {
    this.gameOverFlag = true;
    // stop the object spawn timer
    this.objectSpawnTimer.destroy();
    this.powerUpSpawnTimer.destroy();

    // play the death animation
    this.character.anims.play('character-death');

    // show a game over message
    const gameOverText = this.add.text(400, 300, 'Game Over - press "Space" to restart', {
      font: '32px Arial',
      color: '#000000'
    });
    gameOverText.setOrigin(0.5);

    // allow the player to restart the game by pressing a key
    if (this.input.keyboard) {
      this.input.keyboard.once(
        'keydown',
        () => {
          // reset the game state
          this.gameOverFlag = false;

          this.characterHealth = this.maxCharacterHealth;
          this.character.anims.play('character-walk-back', true);
          this.character.clearTint();

          this.updateHealthDisplay();
          this.setupPowerUp(false);
          gameOverText.destroy();
          this.objectGroup.forEach((object) => object.destroy(true));
          this.objectGroup = [];
          this.nonCollidableGroup.forEach((object) => object.destroy(true));
          this.nonCollidableGroup = [];
          this.setupTimers();

          // restart the game
          const width = this.cameras.main.width;
          this.character.setPosition(width / 2, this.character.y);
        },
        this
      );
    }
  };

  private setupTimers = () => {
    const obstacles = ['rock', 'tree'];
    this.objectSpawnTimer = this.time.addEvent({
      delay: 500, // spawn an object every 2 seconds
      loop: true,
      callback: () => this.spawnObject(obstacles[Math.floor(Math.random() * obstacles.length)], 'obstacle')
    });
    const powerUps = ['cake1', 'cake2', 'cake3', 'cake4'];
    this.powerUpSpawnTimer = this.time.addEvent({
      delay: 1000, // spawn an object every 1 second
      loop: true,
      callback: () => this.spawnObject(powerUps[Math.floor(Math.random() * powerUps.length)], 'powerUp')
    });
  };

  override destroy() {
    super.destroy();
    this.objectSpawnTimer.destroy();

    this.character.destroy();
    this.healthDisplayText.destroy();
    this.objectGroup.forEach((object) => object.destroy(true));
    this.objectGroup = [];
    this.nonCollidableGroup.forEach((object) => object.destroy(true));
    this.nonCollidableGroup = [];
  }
}
