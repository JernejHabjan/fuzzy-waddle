import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { BuildingPrerequisitesDefinition } from "../../data/tech-tree/actor-prerequisites";
import type { InfoDefinition } from "../../entity/components/info-definition";
import type { ObjectDescriptorDefinition } from "../../entity/components/object-descriptor-definition";
import type { RepresentableDefinition } from "../../entity/components/representable-definition";
import type { VisionDefinition } from "../../entity/components/vision-definition";
import type { AudioDefinition } from "../../entity/components/actor-audio/audio-definition";
import type { ActorAnimationsDefinition } from "../../entity/components/animation/actor-animations-definition";
import type { ActorTranslateDefinition } from "../../entity/components/movement/actor-translate-definition";
import type { ColliderDefinition } from "../../entity/components/movement/collider-definition";
import type { FlightDefinition } from "../../entity/components/movement/flight-definition";
import type { WalkableDefinition } from "../../entity/components/movement/walkable-definition";
import type { PawnAiDefinition } from "../ai-agents/pawn-ai-definition";
import type { OwnerDefinition } from "../../entity/components/owner-definition";
import type { RequirementsDefinition } from "../../entity/components/requirements-definition";
import type { SelectableDefinition } from "../../entity/components/selectable-definition";
import type { ContainerDefinition } from "../../entity/components/building/container-definition";
import type { HousingDefinition } from "../../entity/components/building/housing-definition";
import type { HousingCostDefinition } from "../../entity/components/building/housing-cost-definition";
import type { AttackDefinition } from "../../entity/components/combat/components/attack-definition";
import type { HealingDefinition } from "../../entity/components/combat/components/healing-definition";
import type { HealthDefinition } from "../../entity/components/combat/components/health-definition";
import type { BuilderDefinition } from "../../entity/components/construction/builder-definition";
import type { ConstructionSiteDefinition } from "../../entity/components/construction/construction-site-definition";
import type { ProductionDefinition } from "../../entity/components/production/production-definition";
import type { ProductionCostDefinition } from "../../entity/components/production/production-cost-definition";
import type { GathererDefinition } from "../../entity/components/resource/gatherer-definition";
import type { ResourceDrainDefinition } from "../../entity/components/resource/resource-drain-definition";
import type { ResourceSourceDefinition } from "../../entity/components/resource/resource-source-definition";
import type { SpellDefinition } from "../../entity/components/combat/spell-definition";
import type { ResearchDefinition } from "../../entity/components/research/research-component";
import type { QueueDefinition } from "../../entity/components/production/queue-definition";
import type { LevelDefinition } from "../../entity/components/level/level-definition";

// Extract components definition to reuse in both PrefabDefinition and LevelOverrides
export type ComponentsDefinition = Partial<{
  objectDescriptor: ObjectDescriptorDefinition;
  representable: RepresentableDefinition;
  owner: OwnerDefinition;
  vision: VisionDefinition;
  info: InfoDefinition;
  health: HealthDefinition;
  attack: AttackDefinition;
  productionCost: ProductionCostDefinition;
  housingCost: HousingCostDefinition;
  housing: HousingDefinition;
  requirements: RequirementsDefinition;
  builder: BuilderDefinition;
  constructable: ConstructionSiteDefinition;
  walkable: WalkableDefinition;
  gatherer: GathererDefinition;
  container: ContainerDefinition;
  resourceDrain: ResourceDrainDefinition;
  resourceSource: ResourceSourceDefinition;
  production: ProductionDefinition;
  queue: QueueDefinition;
  healing: HealingDefinition;
  spell: SpellDefinition;
  research: ResearchDefinition;
  translatable: ActorTranslateDefinition;
  flying: FlightDefinition;
  animatable: ActorAnimationsDefinition;
  aiControlled: PawnAiDefinition;
  containable: { enabled: boolean };
  selectable: SelectableDefinition;
  collider: ColliderDefinition;
  audio: AudioDefinition;
  buildingPrerequisites: BuildingPrerequisitesDefinition;
  level: LevelDefinition;
}>;

// Extract systems definition to reuse in both PrefabDefinition and LevelOverrides
export type SystemsDefinition = Partial<{
  movement: { enabled: boolean };
  action: { enabled: boolean };
  spellCasting: { enabled: boolean };
}>;

// Type for level overrides - only specify what changes per level
// Reuses ComponentsDefinition and SystemsDefinition
export type LevelOverrides = {
  [level: number]: Partial<{
    components: ComponentsDefinition;
    systems: SystemsDefinition;
  }>;
};

export type PrefabDefinition = Partial<{
  components: ComponentsDefinition;
  systems: SystemsDefinition;
  meta: Partial<{
    randomOfType: ObjectNames[];
    isMainBuilding: boolean;
    maxLevel: number;
    levelOverrides: LevelOverrides;
  }>;
}>;

/**
 * Deep merge helper - merges override into base
 */
function deepMerge<T>(base: T, override: Partial<T>): T {
  if (!override) return base;

  const result = { ...base };

  for (const key in override) {
    const overrideValue = override[key];
    const baseValue = result[key];

    if (overrideValue !== undefined) {
      if (typeof overrideValue === "object" && overrideValue !== null && !Array.isArray(overrideValue)) {
        // Recursively merge objects
        result[key] = deepMerge(baseValue as any, overrideValue as any);
      } else {
        // Replace primitive values and arrays
        result[key] = overrideValue as any;
      }
    }
  }

  return result;
}

/**
 * Apply level overrides to a base definition
 */
export function applyLevelOverrides(baseDef: PrefabDefinition, level: number): PrefabDefinition {
  const levelOverrides = baseDef.meta?.levelOverrides;
  if (!levelOverrides || !levelOverrides[level]) {
    return baseDef;
  }

  return deepMerge(baseDef, levelOverrides[level]);
}
