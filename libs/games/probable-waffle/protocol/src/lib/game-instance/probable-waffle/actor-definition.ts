import type {
  ConstructionSiteComponentData,
  HealthComponentData
} from "../../communicators/probable-waffle/communicator-game-events";
import type { ObjectNames } from "./object-names";
import type {
  ActorTranslateComponentData,
  AttackComponentData,
  BackboardComponentData,
  BuilderComponentData,
  ContainerComponentData,
  ConvertibleComponentData,
  GathererComponentData,
  HealingComponentData,
  HousingComponentData,
  IdComponentData,
  LevelComponentData,
  OwnerComponentData,
  ProductionComponentData,
  RepresentableComponentData,
  ResearchComponentData,
  ResourceDrainComponentData,
  ResourceSourceComponentData,
  SelectableComponentData,
  ScenarioActorReferenceData,
  SpellComponentData,
  StatusEffectComponentData,
  TendableComponentData,
  VisionComponentData,
  NavigableComponentData
} from "./component-data";

/**
 * Defines the structured actor definition contract for this module. Its declared surface makes name, owner,
 * id, scenario explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface ActorDefinition {
  [key: string]: unknown;
  /**
   * Optional human-facing name for {@link ActorDefinition}. It supports UI, narration, or diagnostics and must
   * not be used as the stable identity of the record.
   */
  name?: ObjectNames;
  /**
   * Optional owner value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  owner?: Partial<OwnerComponentData>;
  /**
   * Optional stable id used by {@link ActorDefinition} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  id?: Partial<IdComponentData>;
  /**
   * Optional scenario value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  scenario?: ScenarioActorReferenceData;
  /**
   * Optional health value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  health?: Partial<HealthComponentData>;
  /**
   * Optional housing value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  housing?: Partial<HousingComponentData>;
  /**
   * Optional construction site value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  constructionSite?: Partial<ConstructionSiteComponentData>;
  /**
   * Optional selected value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  selected?: Partial<SelectableComponentData>;
  /**
   * Optional vision value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  vision?: Partial<VisionComponentData>;
  /**
   * Optional attack value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  attack?: Partial<AttackComponentData>;
  /**
   * Optional healing value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  healing?: Partial<HealingComponentData>;
  /**
   * Optional builder value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  builder?: Partial<BuilderComponentData>;
  /**
   * Optional gatherer value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  gatherer?: Partial<GathererComponentData>;
  /**
   * Optional container value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  container?: Partial<ContainerComponentData>;
  /**
   * Optional resource drain value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  resourceDrain?: Partial<ResourceDrainComponentData>;
  /**
   * Optional resource source value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  resourceSource?: Partial<ResourceSourceComponentData>;
  /**
   * Optional production value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  production?: Partial<ProductionComponentData>;
  /**
   * Optional research value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  research?: Partial<ResearchComponentData>;
  /**
   * Optional translatable value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  translatable?: Partial<ActorTranslateComponentData>;
  /**
   * Optional navigable value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  navigable?: Partial<NavigableComponentData>;
  /**
   * Optional representable value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  representable?: Partial<RepresentableComponentData>;
  /**
   * Optional blackboard value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  blackboard?: Partial<BackboardComponentData>;
  /**
   * Optional convertible value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  convertible?: Partial<ConvertibleComponentData>;
  /**
   * Optional spell value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  spell?: Partial<SpellComponentData>;
  /**
   * Optional status effects value carried by {@link ActorDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  statusEffects?: Partial<StatusEffectComponentData>;
  /**
   * Optional level value carried by {@link ActorDefinition}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  level?: Partial<LevelComponentData>;
  /** Current crop growth and assigned tender identities. */
  tendable?: Partial<TendableComponentData>;
}
