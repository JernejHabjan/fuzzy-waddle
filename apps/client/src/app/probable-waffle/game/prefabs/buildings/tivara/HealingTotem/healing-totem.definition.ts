import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";

export const healingTotemDefinition = {
  components: {
    representable: {
      width: 32,
      height: 64,
      origin: { x: 0.5, y: 0.9 }
    },
    objectDescriptor: {
      color: 0x00ff88
    },
    owner: {
      color: [{ originalColor: 0x00ff88, epsilon: 0.15 }]
    },
    vision: {
      range: 4
    },
    info: {
      name: "Healing Totem",
      description: "A mystical totem that heals nearby allies",
      smallImage: {
        key: "factions",
        frame: "spell_icons/healing_totem.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 50
    },
    selectable: {},
    healing: {
      healPerCooldown: 5,
      cooldown: 2000,
      range: 4
    }
  },
  systems: {}
} satisfies PrefabDefinition;
