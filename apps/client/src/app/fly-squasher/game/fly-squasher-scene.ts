import { BaseScene } from "../../shared/game/phaser/scene/base.scene";
import {
  FlySquasherGameMode,
  FlySquasherGameModeData,
  FlySquasherGameState,
  FlySquasherGameStateData,
  FlySquasherLevelEnum,
  FlySquasherPlayer,
  FlySquasherPlayerControllerData,
  FlySquasherPlayerStateData,
  FlySquasherSpectator,
  FlySquasherSpectatorData
} from "@fuzzy-waddle/api-interfaces";
import { Scenes } from "./consts/scenes";
import { Fly } from "./fly/fly";
import { Scenery } from "./scenery/Scenery";
import { FlyFactory } from "./fly/fly.factory";
import { FlySquasherGameData } from "./fly-squasher-game-data";
import { FlySquasherAudio } from "./audio";
import { FlySquasherCommunicatorService } from "./fly-squasher-communicator.service";

export class FlySquasherScene extends BaseScene<
  FlySquasherGameData,
  FlySquasherGameStateData,
  FlySquasherGameState,
  FlySquasherGameModeData,
  FlySquasherGameMode,
  FlySquasherPlayerStateData,
  FlySquasherPlayerControllerData,
  FlySquasherPlayer,
  FlySquasherSpectatorData,
  FlySquasherSpectator,
  FlySquasherCommunicatorService
> {
  private readonly worldSpeedState = {
    initialWorldSpeedPerFrame: 0.2,
    worldSpeedPerFrame: 0.2 // pixels per frame
  };
  private static readonly worldSpeedIncreasePerSquash = 0.01;
  private _livesNumber = 3;
  private _scoreNumber = 0;
  private _scoreText!: Phaser.GameObjects.Text;
  private _livesText!: Phaser.GameObjects.Text;
  private flies: Fly[] = [];
  private gameOverFlag = false;
  private gameOverText?: Phaser.GameObjects.Text;
  private retryText?: Phaser.GameObjects.Text;
  private bossSpawnProbability: number = 0;
  private flySquasherAudio = new FlySquasherAudio();
  constructor() {
    super({ key: Scenes.MainScene });
  }

  override preload() {
    super.preload();
    this.load.multiatlas(
      "fly-squasher-spritesheet",
      "assets/fly-squasher/spritesheets/fly-squasher-spritesheet.json",
      "assets/fly-squasher/spritesheets"
    );
    this.load.multiatlas(
      "croissants-spritesheet",
      "assets/fly-squasher/spritesheets/scenes/croissants-spritesheet.json",
      "assets/fly-squasher/spritesheets/scenes"
    );
    this.load.audio("ost-fly-squasher", "assets/fly-squasher/sound/ost/fly-squasher.m4a");
    this.load.audio("flying", "assets/fly-squasher/sound/sfx/fly.mp3");
    this.load.audio("squish", "assets/fly-squasher/sound/sfx/squish.mp3");
    this.load.audio("restaurant", "assets/fly-squasher/sound/background/restaurant.mp3");
    this.load.audioSprite("character", "assets/sfx/character.json");
    this.load.audio("tap", "assets/fly-squasher/sound/sfx/tap.mp3");
    this.load.animation("blood-splatter", "assets/fly-squasher/spritesheets/anims/blood-splatter.json");
  }

  private sendScore = () => {
    const score = this._scoreNumber;
    const level = this.level;
    this.game.data.communicator.score?.send({ score, level });
  };

  override init() {
    super.init();
    this.bossSpawnProbability = this.defaultBossSpawnProbability;
  }

  override create() {
    super.create();

    new Scenery(this, this.flySquasherAudio);
    this.setupTexts();
    this.subscribe(
      this.onResize.subscribe(() => {
        this.handlePositionGameOverText();
        this.handlePositionHudTexts();
      })
    );

    this.playOst();
    this.spawnFlies();
  }

  private playOst = () => {
    if (!this.sound.locked) {
      // already unlocked so play
      this.sound.play(this.ost, { loop: true, volume: this.flySquasherAudio.musicVolumeNormalized });
    } else {
      // wait for 'unlocked' to fire and then play
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        this.sound.play(this.ost, { loop: true, volume: this.flySquasherAudio.musicVolumeNormalized });
      });
    }
  };

  private get ost() {
    switch (this.level) {
      default:
        return "ost-fly-squasher";
    }
  }

  private spawnFlies = () => {
    for (let i = 0; i < this.nrOfFliesToSpawn; i++) {
      // Generate a random delay between 0 and 1000 milliseconds (1 second)
      const delay = Math.random() * 1000;

      setTimeout(() => {
        this.spawnFly();
      }, delay);
    }
  };

  private spawnFly = () => {
    const fly = this.flyOrBossSpawn();

    fly.addSubscription(fly.onFlyHit.subscribe(this.flyHit));
    fly.addSubscription(fly.onFlyKill.subscribe(this.flyKill));
    this.flies.push(fly);
  };

  private get nrOfFliesToSpawn() {
    switch (this.level) {
      case FlySquasherLevelEnum.BuzzkillBlitz:
        return 2;
      default:
        return 1;
    }
  }

  private flyOrBossSpawn = (): Fly => {
    let fly: Fly;
    // Probability check for boss spawn
    const rnd = Math.random();
    if (this.rareBossSpawnProbability === 1 || rnd < this.bossSpawnProbability) {
      if (rnd > 1 - this.rareBossSpawnProbability) {
        fly = FlyFactory.spawnFlyLargeBoss(this, this.worldSpeedState, this.flySquasherAudio);
      } else {
        fly = FlyFactory.spawnFlyBoss(this, this.worldSpeedState, this.flySquasherAudio);
      }
      // Reset boss spawn probability
      this.bossSpawnProbability = this.defaultBossSpawnProbability;
    } else {
      fly = FlyFactory.spawnFly(this, this.worldSpeedState, this.flySquasherAudio);
      this.bossSpawnProbability += this.getBossSpawnProbability;
    }
    return fly;
  };

  private get level(): FlySquasherLevelEnum {
    return this.game.data.gameInstance.gameMode!.data.level!.id;
  }

  private get defaultBossSpawnProbability() {
    switch (this.level) {
      case FlySquasherLevelEnum.BossyBonanza:
        return 1;
      default:
        return 0;
    }
  }

  private get getBossSpawnProbability() {
    switch (this.level) {
      case FlySquasherLevelEnum.BossyBonanza:
        return 1;
      default:
        return Math.random() * 0.1;
    }
  }

  private get rareBossSpawnProbability() {
    switch (this.level) {
      case FlySquasherLevelEnum.BeDoomed:
        return 1;
      default:
        return 0.1;
    }
  }

  private flyKill = () => {
    if (this.gameOverFlag) return;
    this.worldSpeedState.worldSpeedPerFrame += FlySquasherScene.worldSpeedIncreasePerSquash;
    this.spawnFly();
  };

  private flyHit = () => {
    this._scoreNumber += 1;
    this._scoreText.setText("Score: " + this._scoreNumber);
  };

  private setupTexts() {
    this._scoreText = this.add.text(0, 0, "Score: " + this._scoreNumber, { color: "#00000" });
    this._livesText = this.add.text(0, 0, "Lives: " + this._livesNumber, { color: "#00000" });
    this._livesText.setOrigin(1, 0);
    this._scoreText.setOrigin(1, 0);
    this.handlePositionHudTexts();
  }

  override update(time: number, delta: number) {
    super.update(time, delta);
    if (this.gameOverFlag) return;

    // Iterate through each fly in the flies array
    this.flies.forEach((fly, index) => {
      if (!fly || fly.destroyed) return;

      const maxHeight = this.cameras.main.height;

      if (fly.y > maxHeight) {
        this.reducePlayerHealth();
        fly.despawn();

        if (this._livesNumber === 0) {
          this.gameOver();
          this.flies.forEach((fly) => fly.kill());
        } else {
          this.flies.splice(index, 1);
          this.spawnFly();
        }
      }
    });
  }

  private reducePlayerHealth() {
    this._livesNumber -= 1;
    this.sound.playAudioSprite("character", "death1", { volume: this.flySquasherAudio.sfxVolumeNormalized });
    this._livesText.setText("Lives: " + this._livesNumber);
  }

  private gameOver() {
    this.gameOverText = this.add.text(0, 0, "Game over", { font: "32px Arial", color: "#000000" });
    this.gameOverText.setOrigin(0.5);
    // set retryText - countdown 3 seconds. after that allow retry
    this.retryText = this.add.text(0, 0, "Retry in 3", { font: "32px Arial", color: "#000000" });
    this.retryText.setOrigin(0.5);
    setTimeout(() => {
      this.retryText!.setText("Retry in 2");
    }, 1000);
    setTimeout(() => {
      this.retryText!.setText("Retry in 1");
    }, 2000);
    setTimeout(() => {
      this.retryText!.setText("Press to retry");
      this.handleInputOnGameOver();
    }, 3000);
    this.handlePositionGameOverText();
    this.gameOverFlag = true;
    this.sendScore();
  }

  private resetGameState = () => {
    this._livesNumber = 3;
    this._scoreNumber = 0;
    this.bossSpawnProbability = this.defaultBossSpawnProbability;
    this.worldSpeedState.worldSpeedPerFrame = this.worldSpeedState.initialWorldSpeedPerFrame;
    this._livesText.setText("Lives: " + this._livesNumber);
    this._scoreText.setText("Score: " + this._scoreNumber);
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
    if (this.retryText) {
      this.retryText.setPosition(x, y + 50);
    }
  };

  private handleInputOnGameOver = () => {
    this.input.once("pointerdown", this.resetGame);
  };

  private resetGame = () => {
    this.gameOverText?.destroy();
    this.retryText?.destroy();
    this.resetGameState();
    this.gameOverFlag = false;
    this.spawnFlies();
  };

  override destroy() {
    super.destroy();
    this.flies.forEach((fly) => fly.destroy());
  }
}
