import type { SpellType } from "../combat/spell-type";
import { type ObjectNames, ResearchType, type ResourceType } from "@fuzzy-waddle/api-interfaces";

export interface ResearchData {
  type: ResearchType;
  name: string;
  description: string;
  unlocksSpell?: SpellType; // spell unlocked by this research
  upgradesUnit?: { unitType: ObjectNames; targetLevel: number }; // unit upgrade research
  cost: Partial<Record<ResourceType, number>>;
  researchTime: number; // ms
  icon: { key: string; frame: string };
  requiredBuilding?: ObjectNames; // building that provides this research
  refundFactor: number; // factor for calculating refunds when research is cancelled (e.g., 0.5 = 50% refund)
  prerequisiteResearch?: ResearchType[]; // research types that must be completed before this one
}
