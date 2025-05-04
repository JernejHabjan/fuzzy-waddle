import GameObject = Phaser.GameObjects.GameObject;
import { setActorData } from "../../../../data/actor-data";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../../entity/actor/components/object-descriptor-component";
import {
  AudioActorComponent,
  AudioDefinition,
  SoundType
} from "../../../../entity/actor/components/audio-actor-component";
import { ActorsFoliageSfxBushSounds } from "../../../../sfx/ActorsFoliageSfx";
import { getActorComponent } from "../../../../data/actor-component";
import { getGameObjectBounds } from "../../../../data/game-object-helper";

export class BushRustleComponent {
  constructor(
    private readonly gameObject: GameObject,
    color: number | null
  ) {
    setActorData(
      gameObject,
      [
        new ObjectDescriptorComponent({
          color
        } satisfies ObjectDescriptorDefinition),
        new AudioActorComponent(gameObject, {
          sounds: {
            [SoundType.Select]: ActorsFoliageSfxBushSounds
          }
        } satisfies AudioDefinition)
      ],
      []
    );
    this.gameObject.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.pointerDown, this);
    this.gameObject.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private playingTween = false;

  private pointerDown() {
    this.rustleBush();
    this.spawnBerry();
  }
  private rustleBush() {
    // shake the bush fast (distort the image)
    if (this.playingTween) return;
    this.playingTween = true;
    const audioActorComponent = getActorComponent(this.gameObject, AudioActorComponent);
    audioActorComponent?.playSpatialCustomSound(SoundType.Select);
    this.gameObject.scene.tweens.add({
      targets: this.gameObject,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.playingTween = false;
      }
    });
  }

  private spawnBerry() {
    const texture = "outside";
    const frames = ["foliage/fruits/blue-fruit.png", "foliage/fruits/red-fruit.png"];
    const randomFrame = frames[Math.floor(Math.random() * frames.length)];

    const bounds = getGameObjectBounds(this.gameObject);
    if (!bounds) return;

    const berry = this.gameObject.scene.add.sprite(bounds.centerX, bounds.centerY, texture, randomFrame);
    berry.setOrigin(0.5, 0.5);
    berry.setScale(0.5);
    berry.setDepth(1000);

    const xOffset = Phaser.Math.Between(-40, 40);
    const peakY = bounds.centerY - 60;
    const landX = bounds.centerX + Phaser.Math.Between(-60, 60);
    const landY = bounds.centerY + Phaser.Math.Between(10, 30);

    // Jump up and sideways
    this.gameObject.scene.tweens.add({
      targets: berry,
      x: bounds.centerX + xOffset,
      y: peakY,
      duration: 300,
      ease: "Power1",
      onComplete: () => {
        // Fall to landing position
        this.gameObject.scene.tweens.add({
          targets: berry,
          x: landX,
          y: landY,
          duration: 400,
          ease: "Bounce.easeOut",
          onComplete: () => {
            // Fade out and destroy
            this.gameObject.scene.tweens.add({
              targets: berry,
              alpha: 0,
              duration: 400,
              onComplete: () => berry.destroy()
            });
          }
        });
      }
    });
  }

  destroy() {
    if (!this.gameObject.scene) return;
    this.gameObject.scene.tweens.killAll();
    this.gameObject.scene.tweens.destroy();
    this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.gameObject.update, this);
  }
}
