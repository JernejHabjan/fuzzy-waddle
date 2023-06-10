import { Subject } from 'rxjs';

export class Fly {
  private readonly initialWorldSpeedPerFrame = 0.5;
  private readonly worldSpeedIncreasePerSquash = 0.05;
  private worldSpeedPerFrame = this.initialWorldSpeedPerFrame; // pixels per frame

  private readonly _fly: Phaser.GameObjects.Sprite;

  readonly onFlyHit: Subject<void> = new Subject<void>();

  constructor(private readonly scene: Phaser.Scene) {
    this._fly = this.scene.add.sprite(0, 0, 'lm-atlas', 'health'); // todo
    this._fly.setInteractive();
    // set scale
    this._fly.setScale(4);
    // set origin
    this._fly.setOrigin(0.5, 0.5);
    this._fly.on('pointerdown', this.flyHit);
    this.setFlyRandomPosition();
  }

  get y() {
    return this._fly.y;
  }

  update(time: number, delta: number) {
    const worldSpeedThisFrame = Math.round(this.worldSpeedPerFrame * delta);
    this._fly.y = this._fly.y + worldSpeedThisFrame;
  }

  generateCoordinates() {
    this.setFlyRandomPosition();
  }

  private setFlyRandomPosition() {
    const position = this.getR();
    this._fly.setPosition(position.x, position.y);
  }

  private flyHit = () => {
    this.generateCoordinates();
    this.worldSpeedPerFrame += this.worldSpeedIncreasePerSquash;
    this.onFlyHit.next();
  };

  /**
   * place fly y between 0 and 1/8 of the screen
   * place fly x between 0 + fly width and screen width - fly width
   */
  getR() {
    const maxHeight = this.scene.cameras.main.height;
    const maxWidth = this.scene.cameras.main.width;

    return {
      x: Phaser.Math.RND.between(this._fly.width, maxWidth - this._fly.width),
      y: Phaser.Math.RND.between(0, maxHeight / 8)
    };
  }

  destroy() {
    this._fly.destroy();
    this._fly.off('pointerdown');
  }

  reset() {
    this.worldSpeedPerFrame = this.initialWorldSpeedPerFrame;
    this.setFlyRandomPosition();
  }
}
