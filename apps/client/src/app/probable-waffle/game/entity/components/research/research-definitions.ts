import type { ResearchData } from "./research-data";
import { SpellType } from "../combat/spell-type";
import { ObjectNames, ResearchType, ResourceType } from "@fuzzy-waddle/api-interfaces";

export const researchDefinitions: Record<ResearchType, ResearchData> = {
  [ResearchType.SnowstormSpell]: {
    type: ResearchType.SnowstormSpell,
    name: "Snowstorm",
    description: "Unlocks the Snowstorm spell for Magicians",
    unlocksSpell: SpellType.Snowstorm,
    cost: { [ResourceType.Minerals]: 100, [ResourceType.Wood]: 50 },
    researchTime: 30000,
    icon: { key: "factions", frame: "spell_icons/snowstorm.png" },
    requiredBuilding: ObjectNames.InfantryInn,
    refundFactor: 0.5
  },

  [ResearchType.FirestormSpell]: {
    type: ResearchType.FirestormSpell,
    name: "Firestorm",
    description: "Unlocks the Firestorm spell for Magicians",
    unlocksSpell: SpellType.Firestorm,
    cost: { [ResourceType.Minerals]: 150, [ResourceType.Wood]: 75 },
    researchTime: 45000,
    icon: { key: "factions", frame: "spell_icons/firestorm.png" },
    requiredBuilding: ObjectNames.InfantryInn,
    refundFactor: 0.5
  },

  [ResearchType.FrostNovaSpell]: {
    type: ResearchType.FrostNovaSpell,
    name: "Frost Nova",
    description: "Unlocks the Frost Nova slow spell for Magicians",
    unlocksSpell: SpellType.FrostNova,
    cost: { [ResourceType.Minerals]: 75, [ResourceType.Wood]: 25 },
    researchTime: 20000,
    icon: { key: "factions", frame: "spell_icons/frost_nova.png" },
    requiredBuilding: ObjectNames.InfantryInn,
    refundFactor: 0.5
  },

  [ResearchType.HealingLightSpell]: {
    type: ResearchType.HealingLightSpell,
    name: "Healing Light",
    description: "Unlocks instant healing spell for Healers",
    unlocksSpell: SpellType.HealingLight,
    cost: { [ResourceType.Minerals]: 50, [ResourceType.Stone]: 25 },
    researchTime: 20000,
    icon: { key: "factions", frame: "spell_icons/healing_light.png" },
    requiredBuilding: ObjectNames.InfantryInn,
    refundFactor: 0.5
  },

  [ResearchType.HealingRainSpell]: {
    type: ResearchType.HealingRainSpell,
    name: "Healing Rain",
    description: "Unlocks AOE healing zone spell for Healers",
    unlocksSpell: SpellType.HealingRain,
    cost: { [ResourceType.Minerals]: 125, [ResourceType.Stone]: 50 },
    researchTime: 40000,
    icon: { key: "factions", frame: "spell_icons/healing_rain.png" },
    requiredBuilding: ObjectNames.InfantryInn,
    refundFactor: 0.5
  },

  [ResearchType.HealingTotemSpell]: {
    type: ResearchType.HealingTotemSpell,
    name: "Healing Totem",
    description: "Unlocks totem summoning spell for Shamans",
    unlocksSpell: SpellType.HealingTotem,
    cost: { [ResourceType.Minerals]: 100, [ResourceType.Wood]: 100 },
    researchTime: 35000,
    icon: { key: "factions", frame: "spell_icons/healing_totem.png" },
    requiredBuilding: ObjectNames.InfantryInn,
    refundFactor: 0.5
  },

  [ResearchType.TivaraSlingshotUpgradeLevel2]: {
    type: ResearchType.TivaraSlingshotUpgradeLevel2,
    name: "Cursed Banshee Elite",
    description: "Upgrades all Cursed Banshees to Elite rank with improved weapons and armor",
    upgradesUnit: { unitType: ObjectNames.TivaraSlingshotFemale, targetLevel: 2 },
    cost: { [ResourceType.Minerals]: 200, [ResourceType.Wood]: 150 },
    researchTime: 40000,
    icon: { key: "factions", frame: "character_icons/tivara/slingshot_female.png" },
    requiredBuilding: ObjectNames.Sandhold,
    refundFactor: 0.5
  },

  [ResearchType.TivaraSlingshotUpgradeLevel3]: {
    type: ResearchType.TivaraSlingshotUpgradeLevel3,
    name: "Cursed Banshee Master",
    description: "Upgrades all Cursed Banshees to Master rank with devastating power",
    upgradesUnit: { unitType: ObjectNames.TivaraSlingshotFemale, targetLevel: 3 },
    cost: { [ResourceType.Minerals]: 400, [ResourceType.Wood]: 300, [ResourceType.Stone]: 200 },
    researchTime: 60000,
    icon: { key: "factions", frame: "character_icons/tivara/slingshot_female.png" },
    requiredBuilding: ObjectNames.Sandhold,
    refundFactor: 0.5,
    prerequisiteResearch: [ResearchType.TivaraSlingshotUpgradeLevel2]
  },

  [ResearchType.TivaraMacemanUpgradeLevel2]: {
    type: ResearchType.TivaraMacemanUpgradeLevel2,
    name: "Anubian Mauler Elite",
    description: "Upgrades all Anubian Maulers to Elite rank with stronger weapons and heavier armor",
    upgradesUnit: { unitType: ObjectNames.TivaraMacemanMale, targetLevel: 2 },
    cost: { [ResourceType.Minerals]: 175 },
    researchTime: 30000,
    icon: { key: "factions", frame: "character_icons/tivara/maceman_male.png" },
    requiredBuilding: ObjectNames.Sandhold,
    refundFactor: 0.5
  },

  [ResearchType.TivaraMacemanUpgradeLevel3]: {
    type: ResearchType.TivaraMacemanUpgradeLevel3,
    name: "Anubian Mauler Master",
    description: "Upgrades all Anubian Maulers to Master rank with devastating melee power",
    upgradesUnit: { unitType: ObjectNames.TivaraMacemanMale, targetLevel: 3 },
    cost: { [ResourceType.Minerals]: 350, [ResourceType.Stone]: 150 },
    researchTime: 50000,
    icon: { key: "factions", frame: "character_icons/tivara/maceman_male.png" },
    requiredBuilding: ObjectNames.Sandhold,
    refundFactor: 0.5,
    prerequisiteResearch: [ResearchType.TivaraMacemanUpgradeLevel2]
  },

  [ResearchType.SkaduweeWarriorUpgradeLevel2]: {
    type: ResearchType.SkaduweeWarriorUpgradeLevel2,
    name: "Garruk Elite",
    description: "Upgrades all Garruks to Elite rank with sharper axes and battle-hardened armor",
    upgradesUnit: { unitType: ObjectNames.SkaduweeWarriorMale, targetLevel: 2 },
    cost: { [ResourceType.Minerals]: 175 },
    researchTime: 30000,
    icon: { key: "factions", frame: "character_icons/skaduwee/warrior_male.png" },
    requiredBuilding: ObjectNames.Sandhold,
    refundFactor: 0.5
  },

  [ResearchType.SkaduweeWarriorUpgradeLevel3]: {
    type: ResearchType.SkaduweeWarriorUpgradeLevel3,
    name: "Garruk Master",
    description: "Upgrades all Garruks to Master rank with overwhelming destructive force",
    upgradesUnit: { unitType: ObjectNames.SkaduweeWarriorMale, targetLevel: 3 },
    cost: { [ResourceType.Minerals]: 350, [ResourceType.Stone]: 150 },
    researchTime: 50000,
    icon: { key: "factions", frame: "character_icons/skaduwee/warrior_male.png" },
    requiredBuilding: ObjectNames.Sandhold,
    refundFactor: 0.5,
    prerequisiteResearch: [ResearchType.SkaduweeWarriorUpgradeLevel2]
  },

  [ResearchType.SkaduweeMagicianUpgradeLevel2]: {
    type: ResearchType.SkaduweeMagicianUpgradeLevel2,
    name: "Umbramancer Elite",
    description: "Upgrades all Umbramancers to Elite rank with amplified shadow and frost energies",
    upgradesUnit: { unitType: ObjectNames.SkaduweeMagicianFemale, targetLevel: 2 },
    cost: { [ResourceType.Minerals]: 200, [ResourceType.Wood]: 150 },
    researchTime: 40000,
    icon: { key: "factions", frame: "character_icons/skaduwee/magician_female.png" },
    requiredBuilding: ObjectNames.Sandhold,
    refundFactor: 0.5
  },

  [ResearchType.SkaduweeMagicianUpgradeLevel3]: {
    type: ResearchType.SkaduweeMagicianUpgradeLevel3,
    name: "Umbramancer Master",
    description: "Upgrades all Umbramancers to Master rank with catastrophic void-fueled sorcery",
    upgradesUnit: { unitType: ObjectNames.SkaduweeMagicianFemale, targetLevel: 3 },
    cost: { [ResourceType.Minerals]: 400, [ResourceType.Wood]: 300, [ResourceType.Stone]: 200 },
    researchTime: 60000,
    icon: { key: "factions", frame: "character_icons/skaduwee/magician_female.png" },
    requiredBuilding: ObjectNames.Sandhold,
    refundFactor: 0.5,
    prerequisiteResearch: [ResearchType.SkaduweeMagicianUpgradeLevel2]
  },

  [ResearchType.SkaduweeRangedUpgradeLevel2]: {
    type: ResearchType.SkaduweeRangedUpgradeLevel2,
    name: "Ravenmark Elite",
    description: "Upgrades all Ravenmarks to Elite rank with superior bows and keener aim",
    upgradesUnit: { unitType: ObjectNames.SkaduweeRangedFemale, targetLevel: 2 },
    cost: { [ResourceType.Minerals]: 175, [ResourceType.Wood]: 100 },
    researchTime: 35000,
    icon: { key: "factions", frame: "character_icons/skaduwee/ranged_female.png" },
    requiredBuilding: ObjectNames.Sandhold,
    refundFactor: 0.5
  },

  [ResearchType.SkaduweeRangedUpgradeLevel3]: {
    type: ResearchType.SkaduweeRangedUpgradeLevel3,
    name: "Ravenmark Master",
    description: "Upgrades all Ravenmarks to Master rank with deadly precision and fearsome range",
    upgradesUnit: { unitType: ObjectNames.SkaduweeRangedFemale, targetLevel: 3 },
    cost: { [ResourceType.Minerals]: 350, [ResourceType.Wood]: 200, [ResourceType.Stone]: 150 },
    researchTime: 55000,
    icon: { key: "factions", frame: "character_icons/skaduwee/ranged_female.png" },
    requiredBuilding: ObjectNames.Sandhold,
    refundFactor: 0.5,
    prerequisiteResearch: [ResearchType.SkaduweeRangedUpgradeLevel2]
  }
};
