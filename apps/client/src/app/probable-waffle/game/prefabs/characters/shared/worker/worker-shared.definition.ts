import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { AiType } from "../../../ai-agents/ai-type";

export const generalWorkerDefinitions: Partial<PrefabDefinition> = {
  components: {
    vision: {
      range: 10
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 50
    },
    attack: {
      attacks: [weaponDefinitions.hands]
    },
    productionCost: {
      resources: {
        [ResourceType.Minerals]: 50
      },
      refundFactor: 0.5,
      productionTime: 5000,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 1
    },
    healing: {
      range: 2,
      healPerCooldown: 5,
      cooldown: 1000
    },
    gatherer: {
      // this high, so AI player can resume gathering resources if last resource source was far away
      resourceSweepRadius: 100,
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
