import { setActorData } from "../../../../../data/actor-data";
import {
  ObjectDescriptorComponent,
  type ObjectDescriptorDefinition
} from "../../../../../entity/components/object-descriptor-component";
import {
  AudioActorComponent,
  type AudioDefinition
} from "../../../../../entity/components/actor-audio/audio-actor-component";
import { ActorsFoliageSfxBushSounds } from "./sfx-bush";
import GameObject = Phaser.GameObjects.GameObject;
import { SoundType } from "../../../../../entity/components/actor-audio/sound-type";

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
