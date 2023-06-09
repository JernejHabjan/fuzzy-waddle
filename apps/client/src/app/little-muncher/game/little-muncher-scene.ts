import { Scenes } from './const/scenes';
import {
  LittleMuncherGameMode,
  LittleMuncherGameModeData,
  LittleMuncherGameState,
  LittleMuncherGameStateData,
  LittleMuncherHills,
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
import { UiCommunicator, UiCommunicatorData } from './ui-communicator';
import { Fireworks } from '../../shared/game/phaser/components/fireworks';

export enum ObjectName {
  'obstacle' = 'obstacle',
  'powerUp' = 'powerUp'
}

export enum ObjectProperty {
  'type' = 'type',
  'bounced' = 'bounced'
}

export enum ObjectType {
  'bird' = 'bird',
  'tree' = 'tree',
  'rock' = 'rock',
  'cake1' = 'cake1',
  'cake2' = 'cake2',
  'cake3' = 'cake3',
  'cake4' = 'cake4'
}

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

  private readonly climbedPerSecond = 30;
  private readonly initialWorldSpeedPerFrame = 0.5;
  private readonly maxWorldSpeedPerFrame = this.initialWorldSpeedPerFrame * 3;
  private readonly maxCharacterHealth = 3;
  private readonly powerUpDuration = 2000;
  private readonly objectVelocity = 100;
  private readonly fullWorldWidth = 600;
  private readonly objectMargin = 100;
  private readonly objectDestroyMargin = 200;
  private readonly powerUpScore = this.climbedPerSecond * 5;
  private readonly scorePerSecond = this.climbedPerSecond;
  private readonly scoreBroadcastInterval = this.powerUpScore;
  private readonly scoreBroadcastIntervalLocally = this.scorePerSecond;
  private readonly climbedBroadcastIntervalLocally = this.climbedPerSecond;
  private worldWidth!: number;
  private worldSpeedPerFrame = this.initialWorldSpeedPerFrame; // pixels per frame
  private objectGroup: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] = [];
  private nonCollidableGroup: Phaser.Physics.Arcade.Sprite[] = [];
  private character!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private objectSpawnTimer?: Phaser.Time.TimerEvent;
  private powerUpSpawnTimer?: Phaser.Time.TimerEvent;
  private characterHealth = this.maxCharacterHealth;
  private background!: Phaser.GameObjects.TileSprite;
  private gameOverFlag = false;
  private poweredUp: Date | null = null;
  private objectScale = -1;
  private viewPortX!: number;
  private gameOverText?: Phaser.GameObjects.Text | undefined;
  private uiCommunicator = new UiCommunicator();
  private fireworks?: Fireworks;
  private prevBroadcastScoreLocally = 0;
  private prevBroadcastScore = 0;
  private prevBroadcastClimbed = 0;

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
  }

  override init() {
    super.init();
    new Pause(this);
    this.playerInputController = new PlayerInputController(this);
  }

  override create() {
    super.create();
    this.setViewport();
    this.drawBackground();

    // bind resize event
    this.subscribe(
      this.onResize.subscribe(() => {
        this.setViewport();
        this.setBackgroundSize();
        this.handleResizeCharacter();
        this.handlePositionGameOverText();
        this.objectGroup.forEach((o) => o.setScale(this.objectScale));
        this.nonCollidableGroup.forEach((o) => o.setScale(this.objectScale));
      })
    );

    this.createAnims();
    this.createCharacter();
    this.playerInputController.init(this.character);

    console.log('hill to climb on:', this.gameMode.data.hill);
    console.log('time climbing:', this.gameState.data.climbedHeight);
    console.log('should be paused:', this.gameState.data.pause);
    // todo console.log('game started at:', this.baseGameData.gameInstance.data.gameInstanceMetadataData!.createdOn);

    this.setupTimers();

    this.setupUiScene();

    this.subscribe(
      this.communicator.timeClimbing?.onWithInitial(
        this.manageTimeClimbing,
        (event) => (this.gameState.data.climbedHeight = event.timeClimbing)
      )
    );
    this.subscribe(this.communicator.reset?.on.subscribe(() => this.resetGame(false)));
  }

  private manageTimeClimbing = () => {
    const hill = LittleMuncherHills[this.gameMode.data.hill!];
    const climbedHeight = this.gameState.data.climbedHeight;
    const timeToClimb = hill.height;

    if (climbedHeight >= timeToClimb) {
      this.gameOver(true);
    }
  };

  private setupUiScene() {
    const data: UiCommunicatorData = {
      maxCharacterHealth: this.maxCharacterHealth,
      communicator: this.uiCommunicator
    };
    this.scene.run(Scenes.UiScene, data);
  }

  private setViewport() {
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    this.worldWidth = screenWidth > this.fullWorldWidth ? this.fullWorldWidth : screenWidth;
    this.playerInputController.setWorldWidth(this.worldWidth);
    this.objectScale = screenWidth > this.fullWorldWidth ? 2 : 1.5;

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
    this.anims.create({ key: 'character-victory-front', frames: characterVictoryFront, frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'character-victory-back', frames: characterVictoryBack, frameRate: 10, repeat: -1 });
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

    // change hitbox size
    this.character.setSize(24, 36);
    // set the character's size and physics properties
    this.character.setCollideWorldBounds(true);
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

    const worldSpeedThisFrame = Math.round(this.worldSpeedPerFrame * delta);

    this.playerInputController.handleCharacterMovement(worldSpeedThisFrame);

    // move world objects down
    this.objectGroup.forEach((sprite) => {
      const bounced = sprite.getData('bounced'); // todo static type
      if (!bounced) {
        sprite.y += worldSpeedThisFrame;
      }
    });
    this.nonCollidableGroup.forEach((sprite: Phaser.Physics.Arcade.Sprite) => {
      sprite.y += worldSpeedThisFrame;
    });

    this.background.tilePositionY -= worldSpeedThisFrame;

    // check for collision with random objects
    this.physics.overlap(this.character, this.objectGroup, this.objectCollisionHandler);

    // dispose of objects that have gone off-screen
    this.objectGroup.forEach((object) => this.destroyOffScreenSprite(this.objectGroup, object));
    this.nonCollidableGroup.forEach((object) => this.destroyOffScreenSprite(this.nonCollidableGroup, object));

    this.handlePowerUpUpdate();

    const scoreThisFrame = this.scorePerSecond * (delta / 1000);
    this.updateScore(scoreThisFrame);

    const climbedThisFrame = this.climbedPerSecond * (delta / 1000);
    this.updateClimbed(climbedThisFrame);
  }

  private updateScore(scoreToAdd: number) {
    this.gameState.data.score += scoreToAdd;

    const scoreData = { score: this.gameState.data.score };

    if (
      Math.floor(this.gameState.data.score / this.scoreBroadcastIntervalLocally) >
      Math.floor(this.prevBroadcastScoreLocally / this.scoreBroadcastIntervalLocally)
    ) {
      // broadcast locally every N ticks
      this.communicator.score?.sendLocally(scoreData);
      this.prevBroadcastScoreLocally = this.gameState.data.score;
      if (
        Math.floor(this.gameState.data.score / this.scoreBroadcastInterval) >
        Math.floor(this.prevBroadcastScore / this.scoreBroadcastInterval)
      ) {
        // Broadcast to all observers every N points
        this.communicator.score?.send(scoreData);
        this.prevBroadcastScore = this.gameState.data.score;
      }
    }
  }

  private updateClimbed(climbedToAdd: number) {
    this.gameState.data.climbedHeight += climbedToAdd;

    const climbedData = { timeClimbing: this.gameState.data.climbedHeight };

    if (
      Math.floor(this.gameState.data.climbedHeight / this.climbedBroadcastIntervalLocally) >
      Math.floor(this.prevBroadcastClimbed / this.climbedBroadcastIntervalLocally)
    ) {
      // Broadcast to all observers every N points
      this.communicator.timeClimbing?.send(climbedData);
      this.prevBroadcastClimbed = this.gameState.data.climbedHeight;
    }
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

  private handlePowerUpUpdate = () => {
    if (!this.poweredUp) return;
    const now = new Date();
    if (now.getTime() - this.poweredUp.getTime() > this.powerUpDuration) {
      this.setupPowerUp(false);
    }
  };

  spawnObject = (key: ObjectType, name: ObjectName) => {
    let x = this.seededRandomByTime() * this.worldWidth;
    const y = -this.objectMargin;

    // on mobile, only spawn objects in 3 columns
    if (!this.game.device.os.desktop) {
      // spawn object in one of 3 columns
      const column = Math.floor(this.seededRandomByTime() * 3);
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
      object.destroy();
      return;
    }

    if (key === ObjectType.tree) {
      // decrease the tree collision box y by 40px
      object.body.setSize(object.width, object.height - 40);
      object.body.setOffset(0, 40);
      this.spawnBird(object);
    }
    object.setData(ObjectProperty.type, key);
    this.objectGroup.push(object);
    object.name = name;
  };

  private spawnBird = (object: Phaser.Physics.Arcade.Sprite) => {
    const rnd = this.seededRandomByTime();
    if (rnd > 0.3) return; // 30% chance of spawning a bird

    const bird = this.physics.add.sprite(object.x, object.y - 40 * object.scale, 'lm-atlas', 'bird/0');
    bird.setDepth(1);
    bird.anims.play('bird-idle', true);
    object.setScale(this.objectScale);
    bird.setOrigin(0.5, 0.5);
    object.setData(ObjectType.bird, bird);
    this.nonCollidableGroup.push(bird);
  };

  private objectCollisionHandler: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (characterIn, objectIn): void => {
    const character = characterIn as Phaser.Physics.Arcade.Sprite;
    const object = objectIn as Phaser.Physics.Arcade.Sprite;
    // remove the object from the group

    // do something with the object
    if (object.name === ObjectName.powerUp) {
      // add a power-up to the character
      this.setupPowerUp(true);
      object.destroy();
    } else if (object.name === ObjectName.obstacle) {
      if (!object.getData(ObjectProperty.bounced)) {
        this.manageBirdOnTreeCollision(object);

        if (this.poweredUp && object.getData(ObjectProperty.type) !== ObjectType.tree) {
          // bounce the object
          const randomVelocityBetween4And5 = this.seededRandomByTime() + 4;
          object.body!.velocity.y = -this.objectVelocity * randomVelocityBetween4And5;
          object.setData(ObjectProperty.bounced, true);
        } else {
          this.crashCharacter(character, object);
        }
      }
    } else {
      // do nothing
    }
  };

  /**
   * returns "random" number, that is same for all clients on same date time
   * This number is between 0 and 1
   */
  seededRandomByTime(): number {
    // todo const now = new Date();
    // todo const seed =
    // todo   now.getFullYear() + now.getMonth() + now.getDate() + now.getHours() + now.getMinutes() + now.getSeconds();
    // todo use the seed that is same for all clients
    const random = new Phaser.Math.RandomDataGenerator(/*[seed.toString()]*/);
    return random.frac();
  }

  private manageBirdOnTreeCollision = (object: Phaser.Physics.Arcade.Sprite) => {
    if (object.getData(ObjectProperty.type) !== ObjectType.tree) return;
    // get bird
    const bird = object.getData(ObjectType.bird);
    if (!bird) return;
    // set random x,y velocity, but only up
    const birdVelocity = this.objectVelocity;
    const birdXVelocity = this.seededRandomByTime() * 2 * birdVelocity - birdVelocity;
    const birdYVelocity = -this.seededRandomByTime() * 2 * birdVelocity;
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
    object.destroy();
    // todo play explosion animation
    this.sound.play('hit');
    // shake screen
    this.cameras.main.shake(100, 0.003);

    if (this.poweredUp) {
      return;
    }
    // reduce the character's health
    this.characterHealth -= 1;
    character.tint = 0xff0000;
    // play sound effect
    setTimeout(() => {
      character.clearTint();
    }, 100);
    this.uiCommunicator.setHealth.next(this.characterHealth);
    if (this.characterHealth <= 0) {
      // game over
      this.gameOver(false);
      character.tint = 0xff0000;
    }
  };

  private setupPowerUp(poweredUp: boolean) {
    if (poweredUp) {
      this.updateScore(this.powerUpScore);
      this.poweredUp = new Date();
      this.worldSpeedPerFrame = Math.min(this.worldSpeedPerFrame * 2, this.maxWorldSpeedPerFrame);
    } else {
      this.poweredUp = null;
      this.worldSpeedPerFrame = this.initialWorldSpeedPerFrame;
    }
  }

  private gameOver = (success: boolean) => {
    if (this.gameOverFlag) return;
    this.gameOverFlag = true;
    if (success) {
      this.fireworks = new Fireworks(this, true);
    }
    this.stopTimers();

    if (success) {
      // play victory animation
      const victoryAnimations = ['character-victory-front', 'character-victory-back'];
      this.character.anims.play(victoryAnimations[Math.floor(this.seededRandomByTime() * victoryAnimations.length)]);
    } else {
      this.character.anims.play('character-death');
    }

    const keyboardAvailable = this.input.keyboard?.isActive() && this.game.device.os.desktop;
    let text: string;
    if (success) {
      text = 'Victory!';
    } else {
      text = 'Game Over';
    }
    if (keyboardAvailable) {
      text += ' - press "Space" to restart';
    } else {
      text += ' - tap to restart';
    }
    // show a game over message
    this.gameOverText = this.add.text(0, 0, text, { font: '32px Arial', color: '#000000' });
    this.handlePositionGameOverText();
    this.gameOverText.setOrigin(0.5);

    // allow the player to restart the game by pressing a key
    if (keyboardAvailable) {
      this.input.keyboard!.once('keydown', () => this.resetGame(), this);
    } else {
      this.input.once('pointerdown', () => this.resetGame(), this);
    }
  };

  private stopTimers() {
    if (this.objectSpawnTimer) {
      this.objectSpawnTimer.paused = true;
    }
    if (this.powerUpSpawnTimer) {
      this.powerUpSpawnTimer.paused = true;
    }
  }

  private handlePositionGameOverText = () => {
    const x = this.worldWidth / 2;
    const y = this.cameras.main.height / 2;
    if (this.gameOverText) {
      this.gameOverText.setPosition(x, y);
    }
  };

  private resetGame = (broadcast = true) => {
    // reset the game state
    this.gameOverFlag = false;

    this.characterHealth = this.maxCharacterHealth;
    this.character.anims.play('character-walk-back', true);
    this.character.clearTint();

    this.uiCommunicator.setHealth.next(this.characterHealth);
    this.setupPowerUp(false);
    this.gameOverText?.destroy();
    this.gameOverText = undefined;
    this.objectGroup.forEach((object) => object.destroy());
    this.objectGroup = [];
    this.nonCollidableGroup.forEach((object) => object.destroy());
    this.nonCollidableGroup = [];
    this.setupTimers();
    this.fireworks?.destroy();
    this.fireworks = undefined;

    this.gameState.data.score = 0;
    this.updateScore(0);

    this.gameState.data.climbedHeight = 0;
    this.updateClimbed(0);

    this.prevBroadcastScoreLocally = 0;
    this.prevBroadcastScore = 0;
    this.prevBroadcastClimbed = 0;

    // restart the game
    const width = this.cameras.main.width;
    this.character.setPosition(width / 2, this.character.y);

    if (broadcast) {
      this.communicator.reset?.send({ reset: true });
    }
    this.gameOverFlag = false;
  };

  private setupTimers = () => {
    const largeWordWidth = this.worldWidth === this.fullWorldWidth;
    const obstacles: ObjectType[] = [ObjectType.rock, ObjectType.tree];

    // todo const now = new Date();
    // todo const gameStarted = this.baseGameData.gameInstance.data.gameInstanceMetadataData!.createdOn as Date;
    // todo const timeSinceGameStarted = now.getTime() - gameStarted.getTime(); // todo use this?

    if (this.objectSpawnTimer) {
      this.objectSpawnTimer.paused = false;
    } else {
      this.objectSpawnTimer = this.time.addEvent({
        delay: largeWordWidth ? 500 : 600, // spawn an object every 2 seconds
        loop: true,
        callback: () =>
          this.spawnObject(obstacles[Math.floor(this.seededRandomByTime() * obstacles.length)], ObjectName.obstacle)
      });
    }

    const powerUps: ObjectType[] = [ObjectType.cake1, ObjectType.cake2, ObjectType.cake3, ObjectType.cake4];
    if (this.powerUpSpawnTimer) {
      this.powerUpSpawnTimer.paused = false;
    } else {
      this.powerUpSpawnTimer = this.time.addEvent({
        delay: largeWordWidth ? 3000 : 4000, // spawn an object every 5 seconds
        loop: true,
        callback: () =>
          this.spawnObject(powerUps[Math.floor(this.seededRandomByTime() * powerUps.length)], ObjectName.powerUp)
      });
    }
  };

  override destroy() {
    super.destroy();
    this.stopTimers();

    this.character.destroy();
    this.objectGroup.forEach((object) => object.destroy());
    this.objectGroup = [];
    this.nonCollidableGroup.forEach((object) => object.destroy());
    this.nonCollidableGroup = [];
  }
}
