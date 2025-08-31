import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { weaponDefinitions } from "../../../../entity/components/combat/attack-data";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { AiType } from "../../../agents/pawn-ai-controller";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";

export const generalWorkerDefinitions: Partial<PrefabDefinition> = {
  components: {
    vision: {
      range: 10
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 100
    },
    attack: {
      attacks: [weaponDefinitions.hands]
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 10,
        [ResourceType.Minerals]: 10
      },
      refundFactor: 0.5,
      productionTime: 5000,
      costType: PaymentType.PayImmediately
    },
    healing: {
      range: 2,
      healPerCooldown: 5,
      cooldown: 1000
    },
    gatherer: {
      resourceSweepRadius: 20,
      resourceSourceGameObjectClasses: [
        ResourceType.Ambrosia,
        ResourceType.Wood,
        ResourceType.Minerals,
        ResourceType.Stone
      ]
    },
    selectable: {},
    translatable: {
      tileMoveDuration: 500
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
};
