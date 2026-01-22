import type { ResearchType } from './research-type';
import type { SpellType } from '../combat/spell-type';
import type { ObjectNames, ResourceType } from '@fuzzy-waddle/api-interfaces';

export interface ResearchData {
  type: ResearchType;
  name: string;
  description: string;
  unlocksSpell?: SpellType; // spell unlocked by this research
  cost: Partial<Record<ResourceType, number>>;
  researchTime: number; // ms
  icon: { key: string; frame: string };
  requiredBuilding?: ObjectNames; // building that provides this research
}
