import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { BuildingPrerequisitesDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/data/tech-tree/actor-prerequisites";
import type { InfoDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/info-definition";
import type { ObjectDescriptorDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/object-descriptor-definition";
import type { RepresentableDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/representable-definition";
import type { VisionDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/vision-definition";
import type { AudioDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/actor-audio/audio-definition";
import type { ActorAnimationsDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/animation/actor-animations-definition";
import type { ActorTranslateDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/actor-translate-definition";
import type { ColliderDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/collider-definition";
import type { FlightDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/flight-definition";
import type { NavigableDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/navigable-definition";
import type { PawnAiDefinition } from "../ai-agents/pawn-ai-definition";
import type { OwnerDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/owner-definition";
import type { RequirementsDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/requirements-definition";
import type { SelectableDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/selectable-definition";
import type { ContainerDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/building/container-definition";
import type { HousingDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/building/housing-definition";
import type { HousingCostDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/building/housing-cost-definition";
import type { AttackDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/attack-definition";
import type { HealingDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/healing-definition";
import type { HealthDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/health-definition";
import type { BuilderDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/builder-definition";
import type { ConstructionSiteDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/construction-site-definition";
import type { ProductionDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/production-definition";
import type { ProductionCostDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/production-cost-definition";
import type { GathererDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/resource/gatherer-definition";
import type { ResourceDrainDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/resource/resource-drain-definition";
import type { ResourceSourceDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/resource/resource-source-definition";
import type { SpellDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/spell-definition";
import type { ResearchDefinition } from "../../entity/components/research/research-component";
import type { QueueDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/queue-definition";
import type { LevelDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/level/level-definition";
import type { TendableDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/tendable/tendable-definition";

// Extract components definition to reuse in both PrefabDefinition and LevelOverrides
export type ComponentsDefinition = Partial<{
  /** Minimap/display classification, primarily the actor color and transparency. */
  objectDescriptor: ObjectDescriptorDefinition;
  /** Logical world dimensions, origin and transform data used to represent the actor. */
  representable: RepresentableDefinition;
  /** Player ownership and faction association. */
  owner: OwnerDefinition;
  /** Sight range and fog-of-war visibility behavior. */
  vision: VisionDefinition;
  /** User-facing name, description, tooltip and icon information. */
  info: InfoDefinition;
  /** Hit points, regeneration and death-related health configuration. */
  health: HealthDefinition;
  /** Attack range, damage, cadence, targeting and projectile configuration. */
  attack: AttackDefinition;
  /** Resources charged when this actor is constructed or produced. */
  productionCost: ProductionCostDefinition;
  /** Population or housing capacity consumed by this actor. */
  housingCost: HousingCostDefinition;
  /** Population or housing capacity supplied by this actor. */
  housing: HousingDefinition;
  /** Requirements that control whether the actor can be produced or constructed. */
  requirements: RequirementsDefinition;
  /** Construction capabilities available to builder actors. */
  builder: BuilderDefinition;
  /** Construction-site behavior and build progress for constructible actors. */
  constructable: ConstructionSiteDefinition;
  /** Navigation participation and allowed terrain behavior. */
  navigable: NavigableDefinition;
  /** Resource-gathering capabilities and gathering rates. */
  gatherer: GathererDefinition;
  /** Capacity and rules for actors that can contain other actors. */
  container: ContainerDefinition;
  /** Periodic resource consumption performed by this actor. */
  resourceDrain: ResourceDrainDefinition;
  /** Resource type, capacity and gathering behavior exposed by a resource actor. */
  resourceSource: ResourceSourceDefinition;
  /** Units or actors this actor can produce. */
  production: ProductionDefinition;
  /** Number and capacity of parallel production/research queues. */
  queue: QueueDefinition;
  /** Healing range, amount, cadence and targeting behavior. */
  healing: HealingDefinition;
  /** Spell availability and spell-specific configuration. */
  spell: SpellDefinition;
  /** Research options this actor can perform. */
  research: ResearchDefinition;
  /** Ground movement speed and translation behavior. */
  translatable: ActorTranslateDefinition;
  /** Flying height and airborne movement behavior. */
  flying: FlightDefinition;
  /** Directional sprite animations used by ordinary actors. */
  animatable: ActorAnimationsDefinition;
  /** Directional sprite animations with ship-specific handling. */
  shipAnimatable: ActorAnimationsDefinition;
  /** Pawn AI behavior-tree and decision configuration. */
  aiControlled: PawnAiDefinition;
  /** Marks an actor as eligible to be placed inside a container. */
  containable: { enabled: boolean };
  /** Selection hit area, offsets and selection interaction behavior. */
  selectable: SelectableDefinition;
  /** Navigation collision behavior and optional footprint reduction. */
  collider: ColliderDefinition;
  /** Actor sound effects and audio-sprite mappings. */
  audio: AudioDefinition;
  /** Existing-building conditions required before construction is allowed. */
  buildingPrerequisites: BuildingPrerequisitesDefinition;
  /** Current/max actor level and level-progression configuration. */
  level: LevelDefinition;
  /** Farming/tending interaction supported by crops or similar actors. */
  tendable: TendableDefinition;
}>;

// Extract systems definition to reuse in both PrefabDefinition and LevelOverrides
export type SystemsDefinition = Partial<{
  /** Enables the system that executes movement orders. */
  movement: { enabled: boolean };
  /** Enables the general queued-action/order execution system. */
  action: { enabled: boolean };
  /** Enables deterministic spell-casting command execution. */
  spellCasting: { enabled: boolean };
}>;

// Type for level overrides - only specify what changes per level
// Reuses ComponentsDefinition and SystemsDefinition
export type LevelOverrides = {
  /** Actor level whose component or system values replace/extend the base definition. */
  [level: number]: Partial<{
    /** Component values changed when the actor reaches this level. */
    components: ComponentsDefinition;
    /** System values changed when the actor reaches this level. */
    systems: SystemsDefinition;
  }>;
};

/**
 * Declarative source of truth used to assemble an actor's runtime components and systems.
 * Every section is optional so specialized actors only declare the behavior they need.
 */
export type PrefabDefinition = Partial<{
  /** Data used to construct the actor's runtime components. */
  components: ComponentsDefinition;
  /** Runtime systems attached after the actor's components are created. */
  systems: SystemsDefinition;
  /** Classification and lifecycle metadata that does not create a component itself. */
  meta: Partial<{
    /** Concrete actor names from which one is chosen deterministically when this alias is spawned. */
    randomOfType: ObjectNames[];
    /** Identifies the faction's main/base building for AI, UI and tech-tree rules. */
    isMainBuilding: boolean;
    /** Highest supported actor level. */
    maxLevel: number;
    /** Per-level component and system changes merged over the base definition. */
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
