import { ANIM_WOLF_DEFINITION } from "./anims-wolf";
import type { PrefabDefinition } from "../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../entity/components/combat/weapon-definitions";

export const wolfDefinition = {
  components: {
    representable: {
      width: 48,
      height: 48,
      origin: { x: 0.5, y: 0.631606606461893 }
    },
    objectDescriptor: {
      color: 0x3b4a50
    },
    collider: {
      enabled: false,
      colliderFactorReduction: 0.5
    },
    vision: {
      range: 10
    },
    info: {
      name: "Grey Wolf",
      description: "(critter) A grey wolf",
      tooltipDescription: ["Hostile critter", "Will attack nearby units"],
      smallImage: {
        key: "animals_2",
        frame: "wolf/idle/se/04.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 100,
      healthDisplayBehavior: "onDamage"
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
      attacks: [weaponDefinitions.WolfBite]
    }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
