import { Scenes } from './const/scenes';
import {
  CommunicatorKeyEvent,
  CommunicatorPauseEvent,
  LittleMuncherGameMode,
  LittleMuncherGameState,
  LittleMuncherPlayer,
  LittleMuncherSpectator
} from '@fuzzy-waddle/api-interfaces';
import BaseScene from '../../shared/game/phaser/scene/base.scene';
import { Fireworks } from '../../shared/game/phaser/components/fireworks';
import { LittleMuncherGameData } from './little-muncher-game-data';

export default class MainScene extends BaseScene<
  LittleMuncherGameData,
  LittleMuncherGameState,
  LittleMuncherGameMode,
  LittleMuncherPlayer,
  LittleMuncherSpectator
> {
  private text!: Phaser.GameObjects.Text;
  private fireworks!: Fireworks;

  constructor() {
    super({ key: Scenes.MainScene });
  }

  override init() {
    super.init();
    this.fireworks = new Fireworks(this);
  }

  override create() {
    super.create();
    this.text = this.add.text(100, 100, 'Hello World!');

    console.log('hill to climb on:', this.gameMode.hillToClimbOn);
    console.log('time climbing:', this.gameState.timeClimbing);
    console.log('should be paused:', this.gameState.pause);

    this.setupKeyboard();
    this.setupPause();
  }

  private setupKeyboard() {
    if (this.input.keyboard == null) {
      return;
    }
    if (this.isPlayer) {
      this.input.keyboard.createCursorKeys();
      this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
        const validKeyboardEvent = this.manageKeyboardEvent(event.key);
        if (validKeyboardEvent) {
          this.communicator.key?.send({ key: event.key });
          this.communicator.score?.send({ score: Math.round(Math.random() * 100) });
        }
      });
    }

    this.subscribe(
      this.communicator.key?.on.subscribe((event: CommunicatorKeyEvent) => {
        this.manageKeyboardEvent(event.key);
      })
    );
  }

  private setupPause() {
    // check initial paused gameState
    this.manageGamePause(this.gameState.pause);
    this.subscribe(
      this.communicator.pause?.on.subscribe((event: CommunicatorPauseEvent) => this.manageGamePause(event.pause))
    );
  }

  private manageGamePause(pause: boolean) {
    this.gameState.pause = pause;
    if (pause) {
      this.scene.pause();
    } else {
      this.scene.resume();
    }
  }

  private manageKeyboardEvent(key: string): boolean {
    switch (key) {
      case 'ArrowUp':
        this.text.y -= 10;
        break;
      case 'ArrowDown':
        this.text.y += 10;
        break;
      case 'ArrowLeft':
        this.text.x -= 10;
        break;
      case 'ArrowRight':
        this.text.x += 10;
        break;
      default:
        return false;
    }
    return true;
  }
}
