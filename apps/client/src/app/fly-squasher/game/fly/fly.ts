import { Subject, Subscription } from 'rxjs';
import { FlyPrefab } from './fly-prefab';

export class Fly {
  private readonly initialWorldSpeedPerFrame = 0.2;
  private readonly worldSpeedIncreasePerSquash = 0.01;
  private worldSpeedPerFrame = this.initialWorldSpeedPerFrame; // pixels per frame

  private readonly _fly: FlyPrefab;

  readonly onFlyHit: Subject<void> = new Subject<void>();
  private flyPrefabPointerHitSubscription: Subscription;

  constructor(private readonly scene: Phaser.Scene) {
    this._fly = new FlyPrefab(scene);
    scene.add.existing(this._fly);
    this.flyPrefabPointerHitSubscription = this._fly.pointerDown.subscribe(this.flyHit);

    this.setFlyRandomPosition();
  }

  get y() {
    return this._fly.y;
  }

  update(time: number, delta: number) {
    const rotationSpeed = 0.002; // Adjust this value to control the rotation speed
    const rotationAmplitude = 0.02; // Adjust this value to control the rotation amplitude

    const margin = this._fly.width / 2;

    const worldSpeedThisFrame = Math.round(this.worldSpeedPerFrame * delta);
    this._fly.y = this._fly.y + worldSpeedThisFrame;
    // assign new rotation from current rotation + some value
    this._fly.rotation = this._fly.rotation + rotationAmplitude * Math.sin(rotationSpeed * time);

    const newX = this._fly.x - worldSpeedThisFrame * Math.sin(this._fly.rotation);
    if (newX > margin && newX < this.scene.cameras.main.width - margin) {
      this._fly.x = newX;
    }

    // if fly is out of screen, take current rotation mirror it over x and y axis
    if (newX < margin) {
      this._fly.rotation = this._fly.rotation - Math.PI / 4;
    }
    if (newX > this.scene.cameras.main.width - margin) {
      this._fly.rotation = this._fly.rotation + Math.PI / 4;
    }
  }

  generateCoordinates() {
    this.setFlyRandomPosition();
  }

  private setFlyRandomPosition() {
    const position = this.getR();
    this._fly.setPosition(position.x, position.y);
    // reset rotation
    this._fly.rotation = 0;
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
    this.flyPrefabPointerHitSubscription.unsubscribe();
    this._fly.destroy();
    this._fly.off('pointerdown');
  }

  reset() {
    this.worldSpeedPerFrame = this.initialWorldSpeedPerFrame;
    this.setFlyRandomPosition();
  }
}
