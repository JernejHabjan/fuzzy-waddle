import { IComponent } from '../services/component.service';

export default class UiBarComponent implements IComponent {
  private gameObject!: Phaser.GameObjects.Sprite;
  private graphics?: Phaser.GameObjects.Graphics;
  private barWidth = 25;
  private barHeight = 4;

  init(gameObject: Phaser.GameObjects.Sprite) {
    this.gameObject = gameObject;
  }

  start() {
    const { scene } = this.gameObject;
    this.graphics = scene.add.graphics();

    this.graphics.fillStyle(0xffffff);
    this.graphics.fillRect(0, 0, this.barWidth, this.barHeight);
  }

  update(time: number, delta: number) {
    // move graphics with player
    if (!this.graphics) {
      return;
    }

    // set this health-bar to be above the player center horizontally
    // get gameObject width
    const { height, x: objectCenterX, y: objectCenterY } = this.gameObject;

    // set graphics x to be half of gameObject width
    const x = objectCenterX - this.barWidth / 2;
    this.graphics.setPosition(x, objectCenterY - height / 2);

    // set depth to be above player
    this.graphics.depth = this.gameObject.depth + 1;
  }
}
