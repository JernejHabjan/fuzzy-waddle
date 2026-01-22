import { ResearchType } from './research-type';
import type { ResearchData } from './research-data';
import { SpellType } from '../combat/spell-type';
import { ObjectNames, ResourceType } from '@fuzzy-waddle/api-interfaces';

export const researchDefinitions: Record<ResearchType, ResearchData> = {
  [ResearchType.SnowstormSpell]: {
    type: ResearchType.SnowstormSpell,
    name: 'Snowstorm',
    description: 'Unlocks the Snowstorm spell for Magicians',
    unlocksSpell: SpellType.Snowstorm,
    cost: { [ResourceType.Minerals]: 100, [ResourceType.Wood]: 50 },
    researchTime: 30000,
    icon: { key: 'factions', frame: 'spell_icons/snowstorm.png' },
    requiredBuilding: ObjectNames.InfantryInn
  },

  [ResearchType.FirestormSpell]: {
    type: ResearchType.FirestormSpell,
    name: 'Firestorm',
    description: 'Unlocks the Firestorm spell for Magicians',
    unlocksSpell: SpellType.Firestorm,
    cost: { [ResourceType.Minerals]: 150, [ResourceType.Wood]: 75 },
    researchTime: 45000,
    icon: { key: 'factions', frame: 'spell_icons/firestorm.png' },
    requiredBuilding: ObjectNames.InfantryInn
  },

  [ResearchType.FrostNovaSpell]: {
    type: ResearchType.FrostNovaSpell,
    name: 'Frost Nova',
    description: 'Unlocks the Frost Nova slow spell for Magicians',
    unlocksSpell: SpellType.FrostNova,
    cost: { [ResourceType.Minerals]: 75, [ResourceType.Wood]: 25 },
    researchTime: 20000,
    icon: { key: 'factions', frame: 'spell_icons/frost_nova.png' },
    requiredBuilding: ObjectNames.InfantryInn
  },

  [ResearchType.HealingLightSpell]: {
    type: ResearchType.HealingLightSpell,
    name: 'Healing Light',
    description: 'Unlocks instant healing spell for Healers',
    unlocksSpell: SpellType.HealingLight,
    cost: { [ResourceType.Minerals]: 50, [ResourceType.Stone]: 25 },
    researchTime: 20000,
    icon: { key: 'factions', frame: 'spell_icons/healing_light.png' },
    requiredBuilding: ObjectNames.InfantryInn
  },

  [ResearchType.HealingRainSpell]: {
    type: ResearchType.HealingRainSpell,
    name: 'Healing Rain',
    description: 'Unlocks AOE healing zone spell for Healers',
    unlocksSpell: SpellType.HealingRain,
    cost: { [ResourceType.Minerals]: 125, [ResourceType.Stone]: 50 },
    researchTime: 40000,
    icon: { key: 'factions', frame: 'spell_icons/healing_rain.png' },
    requiredBuilding: ObjectNames.InfantryInn
  },

  [ResearchType.HealingTotemSpell]: {
    type: ResearchType.HealingTotemSpell,
    name: 'Healing Totem',
    description: 'Unlocks totem summoning spell for Shamans',
    unlocksSpell: SpellType.HealingTotem,
    cost: { [ResourceType.Minerals]: 100, [ResourceType.Wood]: 100 },
    researchTime: 35000,
    icon: { key: 'factions', frame: 'spell_icons/healing_totem.png' },
    requiredBuilding: ObjectNames.InfantryInn
  }
};
