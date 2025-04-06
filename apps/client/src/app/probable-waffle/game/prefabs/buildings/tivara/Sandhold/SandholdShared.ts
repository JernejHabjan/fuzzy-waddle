import { ANIM_TIVARA_BUILDINGS_OLIVAL_SMALL } from "../../../../animations/tivara-buildings";
import { GameObjects } from "phaser";

export class SandholdShared {
  constructor(private readonly gameObject: GameObjects.Container) {}
  spawnCrystal(scene: Phaser.Scene) {
    const span = scene.add.sprite(-48, -48, "factions", "buildings/tivara/olival_small/olival_small-0.png");
    span.scaleX = 0.5;
    span.scaleY = 0.5;
    span.angle = -70;
    span.play(ANIM_TIVARA_BUILDINGS_OLIVAL_SMALL);
    this.gameObject.add(span);

    scene.tweens.add({
      targets: span,
      duration: 1000,
      x: -112,
      y: 64,
      onComplete: function () {
        span.destroy(); // destroy the sprite after the tween completes
      }
    });
  }

  hoverCrystal(scene: Phaser.Scene, hover_crystal: GameObjects.Image) {
    scene.tweens.add({
      targets: hover_crystal,
      y: "-=4", // move up by 4
      duration: 1000, // takes 1000ms
      ease: "Sine.InOut",
      yoyo: true, // reverse the animation after it completes
      loop: -1 // loop indefinitely
    });
  }
}
