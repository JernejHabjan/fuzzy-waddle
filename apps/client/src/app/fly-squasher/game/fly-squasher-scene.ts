import { BaseScene } from '../../shared/game/phaser/scene/base.scene';
import { BaseGameMode, BasePlayer, BaseSpectator, BaseSpectatorData } from '@fuzzy-waddle/api-interfaces';
import { BaseGameData } from '../../shared/game/phaser/game/base-game-data';
import { Scenes } from './consts/scenes';
import { Fly } from './fly/fly';
import { Scenery } from './scenery/Scenery';

export class FlySquasherScene extends BaseScene<
  BaseGameData,
  any,
  any,
  any,
  BaseGameMode,
  any,
  any,
  BasePlayer,
  BaseSpectatorData,
  BaseSpectator
> {
  private _livesNumber = 3;
  private _scoreNumber = 0;
  private _scoreText!: Phaser.GameObjects.Text;
  private _livesText!: Phaser.GameObjects.Text;
  private fly!: Fly;
  private gameOverFlag = false;
  private gameOverText?: Phaser.GameObjects.Text;
  private scenery!: Scenery;

  constructor() {
    super({ key: Scenes.MainScene });
  }

  override preload() {
    super.preload();
    this.load.multiatlas(
      'fly-squasher-spritesheet',
      'assets/fly-squasher/spritesheets/fly-squasher-spritesheet.json',
      'assets/fly-squasher/spritesheets'
    );
    this.load.multiatlas(
      'croissants-spritesheet',
      'assets/fly-squasher/spritesheets/scenes/croissants-spritesheet.json',
      'assets/fly-squasher/spritesheets/scenes'
    );
    this.load.audio('ost-fly-squasher', 'assets/fly-squasher/sound/ost/fly-squasher.m4a');
    this.load.audio('flying', 'assets/fly-squasher/sound/sfx/fly.mp3');
    this.load.audio('squish', 'assets/fly-squasher/sound/sfx/squish.mp3');
    this.load.audio('restaurant', 'assets/fly-squasher/sound/background/restaurant.mp3');
    this.load.audio('hit', 'assets/probable-waffle/sfx/character/death/death1.mp3');
  }

  override create() {
    super.create();

    this.scenery = new Scenery(this);
    this.setupTexts();
    this.fly = new Fly(this);
    this.subscribe(
      this.onResize.subscribe(() => {
        this.handlePositionGameOverText();
        this.handlePositionHudTexts();
      })
    );
    this.subscribe(this.fly.onFlyHit.subscribe(this.flyHit));

    this.sound.play('ost-fly-squasher', {
      loop: true
    });
  }

  private flyHit = () => {
    this._scoreNumber += 1;
    this._scoreText.setText('Score: ' + this._scoreNumber);
  };

  private setupTexts() {
    this._scoreText = this.add.text(0, 0, 'Score: ' + this._scoreNumber, { color: '#00000' });
    this._livesText = this.add.text(0, 0, 'Lives: ' + this._livesNumber, { color: '#00000' });
    this._livesText.setOrigin(1, 0);
    this._scoreText.setOrigin(1, 0);
    this.handlePositionHudTexts();
  }

  override update(time: number, delta: number) {
    super.update(time, delta);
    if (this.gameOverFlag) return;

    const maxHeight = this.cameras.main.height;

    if (this.fly.y > maxHeight) {
      this._livesNumber -= 1;
      this.sound.play('hit');
      this._livesText.setText('Lives: ' + this._livesNumber);
      if (this._livesNumber === 0) {
        this.fly.gameOver();
        this.gameOver();
      } else {
        this.fly.generateCoordinates();
      }
      return;
    }
  }

  private gameOver() {
    this.gameOverText = this.add.text(0, 0, 'Game over', { font: '32px Arial', color: '#000000' });
    this.gameOverText.setOrigin(0.5);
    this.handlePositionGameOverText();
    this.gameOverFlag = true;

    this.handleInputOnGameOver();
  }

  private resetGameState = () => {
    this._livesNumber = 3;
    this._scoreNumber = 0;
    this._livesText.setText('Lives: ' + this._livesNumber);
    this._scoreText.setText('Score: ' + this._scoreNumber);
  };

  private handlePositionHudTexts = () => {
    if (this._livesText) {
      this._livesText.setPosition(this.cameras.main.width - 5, 5);
    }
    if (this._scoreText) {
      this._scoreText.setPosition(this.cameras.main.width - 5, this._livesText ? this._livesText.height + 5 : 5);
    }
  };

  private handlePositionGameOverText = () => {
    const x = this.cameras.main.width / 2;
    const y = this.cameras.main.height / 2;
    if (this.gameOverText) {
      this.gameOverText.setPosition(x, y);
    }
  };

  private handleInputOnGameOver = () => {
    const keyboardAvailable = this.input.keyboard?.isActive() && this.game.device.os.desktop;
    if (keyboardAvailable) {
      this.input.keyboard!.once('keydown', this.resetGame);
    } else {
      this.input.once('pointerdown', this.resetGame);
    }
  };

  private resetGame = () => {
    this.fly.reset();
    this.gameOverText?.destroy();
    this.resetGameState();
    this.gameOverFlag = false;
  };
}
