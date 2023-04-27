import { Scenes } from './const/scenes';
import { LittleMuncherCommunicatorKeyEvent } from '@fuzzy-waddle/api-interfaces';
import BaseScene from '../../shared/game/phaser/scene/base.scene';
import { Fireworks } from '../../shared/game/phaser/components/fireworks';
import { LittleMuncherGameData } from './little-muncher-game-data';
import { CommunicatorService } from './communicator.service';

export default class MainScene extends BaseScene<LittleMuncherGameData> {
  private text!: Phaser.GameObjects.Text;
  private fireworks!: Fireworks;
  private communicator!: CommunicatorService;

  constructor() {
    super({ key: Scenes.MainScene });
  }

  override init() {
    super.init();
    this.communicator = this.baseGameData.communicator;
    this.fireworks = new Fireworks(this);
  }

  override create() {
    super.create();
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
        this.communicator.keyboard.sendToServer({ key: event.key });
        this.communicator.score.sendToUi({ score: Math.random() * 100 });
      }
    });
    this.subscribe(
      this.communicator.keyboard.fromServer.subscribe((event: LittleMuncherCommunicatorKeyEvent) => {
        this.manageKeyboardEvent(event.key);
      })
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
