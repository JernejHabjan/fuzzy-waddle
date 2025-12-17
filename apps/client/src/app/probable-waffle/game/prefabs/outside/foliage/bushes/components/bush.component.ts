import { setActorData } from "../../../../../data/actor-data";
import { ObjectDescriptorComponent } from "../../../../../entity/components/object-descriptor-component";
import { AudioActorComponent } from "../../../../../entity/components/actor-audio/audio-actor-component";
import { ActorsFoliageSfxBushSounds } from "./sfx-bush";
import { SoundType } from "../../../../../entity/components/actor-audio/sound-type";
import type { ObjectDescriptorDefinition } from "../../../../../entity/components/object-descriptor-definition";
import type { AudioDefinition } from "../../../../../entity/components/actor-audio/audio-definition";
import GameObject = Phaser.GameObjects.GameObject;

export class BushComponent {
  constructor(gameObject: GameObject, color: number | null) {
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
  }
}
