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
import { Fireworks } from '../../shared/game/phaser/components/fireworks';
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
  private characterGameObject!: Phaser.GameObjects.Text;
  private playerInputController!: PlayerInputController;

  private readonly initialWorldSpeed = 3;
  private worldSpeed = this.initialWorldSpeed; // pixels per frame
  private objectGroup: Phaser.GameObjects.GameObject[] = [];
  private character!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private objectSpawnTimer!: Phaser.Time.TimerEvent;
  private powerUpSpawnTimer!: Phaser.Time.TimerEvent;
  private readonly maxCharacterHealth = 30;
  private characterHealth = this.maxCharacterHealth;
  private healthDisplayText!: Phaser.GameObjects.Text;
  private characterSpeed = 400; // the speed at which the character moves
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys; // variable to store the cursor keys
  private background!: Phaser.GameObjects.TileSprite;
  private gameOverFlag = false;
  private readonly spawnY = -50;
  private powerUpDuration = 5000;
  private poweredUp: Date | null = null;

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
    this.load.image('character', 'assets/character.png');
    this.load.image('object', 'assets/object.png');
    this.load.image('powerUp', 'assets/powerUp.png');
    this.load.image('background', 'assets/background.png');
  }

  override init() {
    super.init();
    new Pause(this);
    this.playerInputController = new PlayerInputController(this);
    new Fireworks(this); // todo it must be here until we rework registration engine
  }

  override create() {
    super.create();
    this.drawBackground();
    this.characterGameObject = this.add.text(100, 100, 'Hello World!');
    this.playerInputController.init(this.characterGameObject);

    console.log('hill to climb on:', this.gameMode.data.hill);
    console.log('time climbing:', this.gameState.data.timeClimbing);
    console.log('should be paused:', this.gameState.data.pause);

    this.communicator.score?.send({ score: Math.round(Math.random() * 100) }); // todo just for testing

    this.createCharacter();

    this.setupTimers();
  }

  private drawBackground = () => {
    // create a graphics object to draw on
    // const graphics = this.add.graphics();
    //
    // // draw a white rectangle on the graphics object
    // graphics.fillStyle(0xffffff, 1);
    // // get viewport height
    // const height = this.cameras.main.height;
    // graphics.fillRect(0, 0, 800, height);

    this.background = this.add.tileSprite(0, 0, 800, 600, 'background');
    this.background.setScrollFactor(0); // make the background stationary
    this.background.setOrigin(0, 0); // set the origin of the sprite to the top-left corner
  };

  private createCharacter = () => {
    // create the character sprite
    this.character = this.physics.add.sprite(400, 550, 'character');

    // set the character's size and physics properties
    this.character.setSize(64, 64);
    this.character.setCollideWorldBounds(true);

    // create the cursor keys
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    this.updateHealthDisplay();
  };

  override update(time: number, delta: number) {
    super.update(time, delta);

    if (this.gameOverFlag) return;
    this.handleCharacterMovement();

    // move world objects down
    this.objectGroup.forEach((object: Phaser.GameObjects.GameObject) => {
      const sprite = object as Phaser.Physics.Arcade.Sprite;
      sprite.y += this.worldSpeed;
    });

    this.background.tilePositionY -= this.worldSpeed * 1.5;

    // check for collision with random objects
    this.physics.overlap(this.character, this.objectGroup, this.objectCollisionHandler);

    // dispose of objects that have gone off-screen
    this.objectGroup.forEach((object: Phaser.GameObjects.GameObject) => {
      // check if object has gone off-screen
      const sprite = object as Phaser.Physics.Arcade.Sprite;
      const camera = this.cameras.main;
      const offsetTop = sprite.height * 2 + Math.abs(this.spawnY) * 2;
      const offsetBottom = sprite.y + sprite.height;
      if (offsetBottom > camera.height || sprite.y < -offsetTop) {
        sprite.destroy();
      }
    });

    this.handlePowerUpUpdate(time, delta);
  }

  private handlePowerUpUpdate = (time: number, delta: number) => {
    if (!this.poweredUp) return;
    const now = new Date();
    if (now.getTime() - this.poweredUp.getTime() > this.powerUpDuration) {
      this.setupPowerUp(false);
    }
  };

  private handleCharacterMovement = () => {
    if (!this.cursors) return;
    // move the character left or right based on the arrow keys
    if (this.cursors.left.isDown) {
      this.character.setVelocityX(-this.characterSpeed);
    } else if (this.cursors.right.isDown) {
      this.character.setVelocityX(this.characterSpeed);
    } else {
      this.character.setVelocityX(0);
    }
  };

  spawnObject = (key: string, name: string) => {
    // todo enum
    const object = this.physics.add.sprite(Math.random() * 800, this.spawnY, key);
    this.objectGroup.push(object);
    object.name = name;
    object.setVelocityY(100);
  };

  objectCollisionHandler = (characterIn: any, objectIn: any) => {
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
      if (this.poweredUp) {
        // bounce the object
        object.body!.velocity.y *= -5;
        // offset the object's position to prevent multiple collisions
        object.y -= this.worldSpeed * 2;
      } else {
        // todo to enum
        object.destroy();

        // reduce the character's health
        this.characterHealth -= 10;
        this.updateHealthDisplay();
        if (this.characterHealth <= 0) {
          // game over
          this.gameOver();
        }
      }
    } else {
      // do nothing
    }
  };

  private setupPowerUp(poweredUp: boolean) {
    if (poweredUp) {
      this.poweredUp = new Date();
      this.worldSpeed = this.worldSpeed * 2;
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

    // stop the character from moving
    this.character.setVelocityX(0);

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
          this.updateHealthDisplay();
          this.setupPowerUp(false);
          gameOverText.destroy();
          this.objectGroup.forEach((object: Phaser.GameObjects.GameObject) => object.destroy(true));
          this.objectGroup = [];
          this.setupTimers();

          // restart the game
          this.character.setVelocityX(0);
          this.character.setPosition(400, 550);
        },
        this
      );
    }
  };

  private setupTimers = () => {
    this.objectSpawnTimer = this.time.addEvent({
      delay: 2000, // spawn an object every 2 seconds
      loop: true,
      callback: () => this.spawnObject('object', 'obstacle')
    });
    this.powerUpSpawnTimer = this.time.addEvent({
      delay: 5000, // spawn an object every 2 seconds
      loop: true,
      callback: () => this.spawnObject('powerUp', 'powerUp')
    });
  };

  override destroy() {
    super.destroy();
    this.objectSpawnTimer.destroy();

    this.character.destroy();
    this.characterGameObject.destroy();
    this.healthDisplayText.destroy();
    this.objectGroup.forEach((object: Phaser.GameObjects.GameObject) => object.destroy(true));
    this.objectGroup = [];
  }
}
