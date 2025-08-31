import { IFlyBase } from "../component.service";
import { BaseScene } from "../../../../shared/game/phaser/scene/base.scene";
import { FlyRepresentableComponent } from "./fly-representable-component";
import { FlyBase } from "../FlyBase";

export type WorldSpeedState = {
  worldSpeedPerFrame: number;
  initialWorldSpeedPerFrame: number;
};

export class FlyMovementComponent implements IFlyBase {
  private representableComponent!: FlyRepresentableComponent;

  constructor(
    private readonly fly: FlyBase,
    private readonly scene: BaseScene,
    private readonly worldSpeedState: WorldSpeedState
  ) {}

  init() {
    this.scene.subscribe(this.scene.onResize.subscribe(this.setFlyRandomPosition));
  }

  start() {
    this.representableComponent = this.fly.components.findComponent(FlyRepresentableComponent);
    this.setFlyRandomPosition();
  }

  update(time: number, delta: number): void {
    if (this.fly.killed) {
      return;
    }
    const rotationSpeed = 0.002; // Adjust this value to control the rotation speed
    const rotationAmplitude = 0.02; // Adjust this value to control the rotation amplitude

    const margin = this.representableComponent.width / 2;

    const worldSpeedThisFrame = Math.round(this.worldSpeedState.worldSpeedPerFrame * delta);
    this.representableComponent.y = this.representableComponent.y + worldSpeedThisFrame;
    // assign new rotation from current rotation + some value
    this.representableComponent.rotation =
      this.representableComponent.rotation + rotationAmplitude * Math.sin(rotationSpeed * time);

    const newX = this.representableComponent.x - worldSpeedThisFrame * Math.sin(this.representableComponent.rotation);
    if (newX > margin && newX < this.scene.cameras.main.width - margin) {
      this.representableComponent.x = newX;
    }

    // if fly is out of screen, take current rotation mirror it over x and y-axis
    if (newX < margin) {
      this.representableComponent.rotation = this.representableComponent.rotation - Math.PI / 4;
    }
    if (newX > this.scene.cameras.main.width - margin) {
      this.representableComponent.rotation = this.representableComponent.rotation + Math.PI / 4;
    }
  }

  private setFlyRandomPosition = () => {
    const position = this.getR();
    this.representableComponent.setPosition(position.x, position.y);
    // reset rotation
    this.representableComponent.rotation = 0;
  };

  /**
   * place fly y between 0 and 1/8 of the screen
   * place fly x between 0 + fly width and screen width - fly width
   */
  private getR() {
    const maxHeight = this.scene.cameras.main.height;
    const maxWidth = this.scene.cameras.main.width;

    return {
      x: Phaser.Math.RND.between(this.representableComponent.width, maxWidth - this.representableComponent.width),
      y: Phaser.Math.RND.between(0, maxHeight / 8)
    };
  }
}
