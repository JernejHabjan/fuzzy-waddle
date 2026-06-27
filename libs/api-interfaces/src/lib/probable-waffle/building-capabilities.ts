import { ObjectNames } from "../game-instance/probable-waffle/object-names";
import { ResearchType } from "../game-instance/probable-waffle/research-type";

export interface BuildingQueueCapabilities {
  queueCapacity: number;
  availableProduceActors?: ObjectNames[];
  availableResearch?: ResearchType[];
}

export const BUILDING_QUEUE_CAPABILITIES: Partial<Record<ObjectNames, BuildingQueueCapabilities>> = {
  [ObjectNames.Sandhold]: {
    queueCapacity: 5,
    availableProduceActors: [ObjectNames.TivaraWorker, ObjectNames.CommonBoat, ObjectNames.VikingBoat],
    availableResearch: [
      ResearchType.TivaraSlingshotUpgradeLevel2,
      ResearchType.TivaraSlingshotUpgradeLevel3,
      ResearchType.TivaraMacemanUpgradeLevel2,
      ResearchType.TivaraMacemanUpgradeLevel3,
      ResearchType.SkaduweeWarriorUpgradeLevel2,
      ResearchType.SkaduweeWarriorUpgradeLevel3,
      ResearchType.SkaduweeMagicianUpgradeLevel2,
      ResearchType.SkaduweeMagicianUpgradeLevel3,
      ResearchType.SkaduweeRangedUpgradeLevel2,
      ResearchType.SkaduweeRangedUpgradeLevel3
    ]
  },
  [ObjectNames.AnkGuard]: {
    queueCapacity: 5,
    availableProduceActors: [ObjectNames.TivaraSlingshotFemale, ObjectNames.TivaraMacemanMale],
    availableResearch: [
      ResearchType.FirestormSpell,
      ResearchType.FrostNovaSpell,
      ResearchType.HealingRainSpell,
      ResearchType.CommonBoatUpgradeLevel2,
      ResearchType.VikingBoatUpgradeLevel2
    ]
  },
  [ObjectNames.Temple]: {
    queueCapacity: 5,
    availableProduceActors: [ObjectNames.TivaraSlingshotFemale, ObjectNames.TivaraAlchemist]
  },
  [ObjectNames.FrostForge]: {
    queueCapacity: 5,
    availableProduceActors: [ObjectNames.SkaduweeWorker]
  },
  [ObjectNames.InfantryInn]: {
    queueCapacity: 5,
    availableProduceActors: [
      ObjectNames.SkaduweeMagicianFemale,
      ObjectNames.SkaduweeRangedFemale,
      ObjectNames.SkaduweeWarriorMale
    ],
    availableResearch: [ResearchType.SnowstormSpell, ResearchType.HealingLightSpell, ResearchType.HealingTotemSpell]
  },
  [ObjectNames.Owlery]: {
    queueCapacity: 5,
    availableProduceActors: [ObjectNames.SkaduweeOwl]
  }
};

export function getBuildingQueueCapabilities(
  buildingName: ObjectNames | undefined
): BuildingQueueCapabilities | undefined {
  if (!buildingName) {
    return undefined;
  }

  return BUILDING_QUEUE_CAPABILITIES[buildingName];
}
