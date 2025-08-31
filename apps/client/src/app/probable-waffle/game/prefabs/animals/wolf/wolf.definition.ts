import { ActorPhysicalType } from "../../../entity/combat/components/health-component";
import { ANIM_WOLF_DEFINITION } from "./anims-wolf";
import { weaponDefinitions } from "../../../entity/combat/attack-data";
import type { PrefabDefinition } from "../../../data/prefab-definition";

export const wolfDefinition = {
  components: {
    representable: {
      width: 64,
      height: 64
    },
    objectDescriptor: {
      color: 0x3b4a50
    },
    vision: {
      range: 10
    },
    info: {
      name: "Grey Wolf",
      description: "(critter) A grey wolf",
      smallImage: {
        key: "animals_2",
        frame: "wolf/idle/se/04.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 100
    },
    translatable: {
      tileMoveDuration: 300
    },
    audio: {
      sounds: {
        // todo
      }
    },
    animatable: { animations: ANIM_WOLF_DEFINITION },
    attack: {
      attacks: [weaponDefinitions.wolfBite]
    }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
