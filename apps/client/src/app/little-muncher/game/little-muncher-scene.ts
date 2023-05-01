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

  private worldSpeed = 3; // pixels per frame
  private objectGroup!: Phaser.Physics.Arcade.Group;
  private character!: any;
  private objectSpawnTimer!: any;
  private characterHealth = 30;
  private healthDisplayText: any;
  private characterSpeed = 400; // the speed at which the character moves
  private cursors?: any; // variable to store the cursor keys

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
    this.objectGroup = this.physics.add.group(); // group for random objects

    this.objectSpawnTimer = this.time.addEvent({
      delay: 2000, // spawn an object every 2 seconds
      loop: true,
      callback: this.spawnObject
    });
  }

  private drawBackground = () => {
    // create a graphics object to draw on
    const graphics = this.add.graphics();

    // draw a white rectangle on the graphics object
    graphics.fillStyle(0xffffff, 1);
    // get viewport height
    const height = this.cameras.main.height;
    graphics.fillRect(0, 0, 800, height);
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

    this.handleCharacterMovement();

    // move world objects down
    this.objectGroup.getChildren().forEach((object: Phaser.GameObjects.GameObject) => {
      const sprite = object as Phaser.Physics.Arcade.Sprite;
      sprite.y += this.worldSpeed;
    });

    // check for collision with random objects
    this.physics.overlap(this.character, this.objectGroup, this.objectCollisionHandler);

    // dispose of objects that have gone off-screen
    this.objectGroup.getChildren().forEach((object: any) => {
      // check if object has gone off-screen
      const camera = this.cameras.main;
      if (object.y + object.height > camera.y + camera.height) {
        object.destroy();
      }
    });
  }

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

  spawnObject = () => {
    const object = this.objectGroup.create(Math.random() * 800, -50, 'object');
    object.name = 'obstacle'; // todo enum
    object.setVelocityY(100);
  };

  objectCollisionHandler = (character: any, object: any) => {
    // remove the object from the group
    object.destroy();

    // do something based on the type of object collided with
    if (object.name === 'powerup') {
      // todo to enum
      // add a powerup to the character
      // TODO addPowerup();
    } else if (object.name === 'obstacle') {
      // todo to enum
      // reduce the character's health
      this.characterHealth -= 10;
      this.updateHealthDisplay();
      if (this.characterHealth <= 0) {
        // game over
        this.gameOver();
      }
    } else {
      // do nothing
    }
  };

  private updateHealthDisplay = () => {
    // remove the old health display text, if it exists
    if (this.healthDisplayText) {
      this.healthDisplayText.destroy();
    }

    // create a new health display text object
    const healthDisplayString = 'Health: ' + this.characterHealth;
    this.healthDisplayText = this.add.text(100, 100, healthDisplayString, { font: '32px Arial', color: '#ffffff' });
  };

  private gameOver = () => {
    // stop the object spawn timer
    this.objectSpawnTimer.destroy();

    // stop the character from moving
    this.character.setVelocityX(0);

    // show a game over message
    const gameOverText = this.add.text(400, 300, 'Game Over', { font: '32px Arial', color: '#ffffff' });
    gameOverText.setOrigin(0.5);

    // allow the player to restart the game by pressing a key
    if (this.input.keyboard) {
      this.input.keyboard.once(
        'keydown',
        () => {
          // reset the game state
          this.characterHealth = 100;
          this.updateHealthDisplay();
          this.worldSpeed = 3;
          gameOverText.destroy();
          this.objectGroup.clear(true, true); // remove all objects from the group
          this.objectSpawnTimer = this.time.addEvent({
            delay: 2000,
            loop: true,
            callback: this.spawnObject
          });

          // restart the game
          this.character.setVelocityX(0);
          this.character.setPosition(400, 550);
        },
        this
      );
    }
  };
}
