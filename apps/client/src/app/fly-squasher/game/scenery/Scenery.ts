import { Croissants } from './Croissants';
import { BaseScene } from '../../../shared/game/phaser/scene/base.scene';

export class Scenery {
  scenePrefab: Croissants;

  constructor(private readonly scene: BaseScene) {
    this.scenePrefab = new Croissants(scene);
    scene.add.existing(this.scenePrefab);
    this.setSceneSize();
    this.scene.subscribe(scene.onResize.subscribe(this.resize));

    this.scene.sound.play('restaurant', {
      loop: true,
      volume: 0.7
    });
  }

  private setSceneSize = () => {
    // stretch scenery to fit half of the screen width and height (max - retain aspect ratio)
    const marginPercent = 0.1;
    const scale = Math.min(
      (this.scene.scale.width * (1 - marginPercent)) / this.scenePrefab.width,
      (this.scene.scale.height * (1 - marginPercent)) / this.scenePrefab.height
    );

    this.scenePrefab.setScale(scale, scale);

    this.scenePrefab.setPosition(
      this.scene.scale.width / 2 - marginPercent * this.scene.scale.width,
      this.scene.scale.height / 2 - marginPercent * this.scene.scale.height
    );
  };

  private resize = () => {
    this.setSceneSize();
  };
}
