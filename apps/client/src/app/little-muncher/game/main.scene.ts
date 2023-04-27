import { Scene } from 'phaser';
import { CreateSceneFromObjectConfig } from '../../shared/game/phaser/scene-config.interface';
import { Scenes } from './const/scenes';
import { SceneCommunicatorService } from './scene-communicator.service';
import { LittleMuncherSceneCommunicatorKeyEvent } from '@fuzzy-waddle/api-interfaces';

export default class MainScene extends Scene implements CreateSceneFromObjectConfig {
  private text!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: Scenes.MainScene });
  }

  init() {
    // todo
  }

  create() {
    this.text = this.add.text(100, 100, 'Hello World!');

    this.setupKeyboard();
  }

  private setupKeyboard() {
    if (this.input.keyboard == null) {
      return;
    }
    this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      const validKeyboardEvent = this.manageKeyboardEvent(event.key);
      if (validKeyboardEvent) {
        SceneCommunicatorService.keyboardSubjectPhaserToServer.next({ key: event.key });
      }
    });
    SceneCommunicatorService.addSubscription(
      SceneCommunicatorService.keyboardSubjectServerToPhaser.subscribe(
        (event: LittleMuncherSceneCommunicatorKeyEvent) => {
          this.manageKeyboardEvent(event.key);
        }
      )
    );
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
