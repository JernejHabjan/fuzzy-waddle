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
    this.gameObject.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.rustleBush, this);
    this.gameObject.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private playingTween = false;

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

  destroy() {
    this.gameObject.scene.tweens.killAll();
    this.gameObject.scene.tweens.destroy();
    this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.gameObject.update, this);
  }
}
