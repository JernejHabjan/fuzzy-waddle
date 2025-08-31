import { setActorData } from "../../../../../data/actor-data";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../../../entity/actor/components/object-descriptor-component";
import {
  AudioActorComponent,
  AudioDefinition,
  SoundType
} from "../../../../../entity/actor/components/audio-actor-component";
import { ActorsFoliageSfxBushSounds } from "./sfx-bush";
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
