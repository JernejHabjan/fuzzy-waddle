/** Coverage state for one capability seam. Planned entries name their owning stage explicitly. */
export type AiCapabilityCoverageDispositionV1 =
  | { readonly status: "implemented"; readonly symbol: string }
  | { readonly status: "planned"; readonly stage: number; readonly symbol: string }
  | { readonly status: "unsupported"; readonly reason: string }
  | { readonly status: "not_applicable"; readonly reason: string };

/** One researched component family traced through every end-to-end AI seam. */
export interface AiCapabilityCoverageEntryV1 {
  readonly family: string;
  readonly source: string;
  readonly observation: AiCapabilityCoverageDispositionV1;
  readonly proposer: AiCapabilityCoverageDispositionV1;
  readonly command: AiCapabilityCoverageDispositionV1;
  readonly outcome: AiCapabilityCoverageDispositionV1;
  readonly save: AiCapabilityCoverageDispositionV1;
  readonly debug: AiCapabilityCoverageDispositionV1;
  readonly fixture: AiCapabilityCoverageDispositionV1;
}

const implemented = (symbol: string): AiCapabilityCoverageDispositionV1 => ({ status: "implemented", symbol });
const planned = (stage: number, symbol: string): AiCapabilityCoverageDispositionV1 => ({
  status: "planned",
  stage,
  symbol
});
const notApplicable = (reason: string): AiCapabilityCoverageDispositionV1 => ({ status: "not_applicable", reason });

function gameplayFamily(
  family: string,
  source: string,
  proposerStage: number,
  fixtureStage: number
): AiCapabilityCoverageEntryV1 {
  return {
    family,
    source,
    observation: implemented("AiObservedActorV1/AiCapabilityCatalogEntryV1"),
    proposer: planned(proposerStage, `${family} proposer`),
    command: implemented("GameCommand + CommandBusService shared application"),
    outcome: implemented("adaptGameCommandOutcomeToBrain"),
    save: implemented("command authority/effect save and recovery adapters"),
    debug: planned(Math.max(6, proposerStage), `${family} debug projection`),
    fixture: planned(fixtureStage, `${family} deterministic fixture`)
  };
}

/**
 * Stage 2 coverage authority. It inventories prefab component/system families and explicit
 * scenario/editor injection so later stages cannot silently omit a mechanic.
 */
export const AI_CAPABILITY_COVERAGE_MANIFEST_V1: readonly AiCapabilityCoverageEntryV1[] = [
  gameplayFamily("ownership_diplomacy", "owner + player/team rules", 4, 4),
  gameplayFamily("logical_position_clearance", "representable + collider", 10, 10),
  gameplayFamily("vision_visibility", "vision + visibility systems", 4, 4),
  gameplayFamily("health_regeneration", "health + healthRegeneration", 13, 13),
  gameplayFamily("attack_target_domains", "attack + effective level overrides", 13, 13),
  gameplayFamily("healing", "healing", 13, 13),
  gameplayFamily("spell_status_zone", "spell + spellCasting + active effects", 13, 13),
  gameplayFamily("construction", "builder + constructable + prerequisites", 7, 7),
  gameplayFamily("production_queue", "production + queue + productionCost", 7, 7),
  gameplayFamily("research", "research + shared queue", 14, 14),
  gameplayFamily("housing", "housing + housingCost + spawn clearance", 7, 7),
  gameplayFamily("gathering", "gatherer + resourceSource", 7, 7),
  gameplayFamily("resource_drain", "resourceDrain", 7, 7),
  gameplayFamily("growth_tending", "tendable + crop growth state", 7, 7),
  gameplayFamily("ground_navigation", "navigable + translatable + movement", 8, 8),
  gameplayFamily("water_navigation", "shipAnimatable + water navigation", 8, 8),
  gameplayFamily("flight", "flying + air navigation", 8, 8),
  gameplayFamily("container_transport", "container + containable", 8, 8),
  gameplayFamily("level_overrides", "level + meta.levelOverrides", 14, 14),
  gameplayFamily("conversion", "convertible runtime component", 4, 4),
  gameplayFamily("mode_goals_results", "GameModeConditionChecker", 9, 9),
  {
    family: "scenario_editor_injected_conversion",
    source: "scenario/editor actor conversion and ownership events",
    observation: implemented("AiObservationV1 evidence/ownership contract"),
    proposer: planned(4, "knowledge/diplomacy reducer"),
    command: notApplicable("conversion is caused by ordinary runtime proximity, never an AI ownership command"),
    outcome: implemented("ConvertibleComponent.ConvertedEvent"),
    save: implemented("ConvertibleComponentData accumulatedTime/converted"),
    debug: planned(4, "conversion evidence projection"),
    fixture: planned(5, "scenario/editor injected conversion bridge")
  },
  {
    family: "presentation_audio_animation",
    source: "info + audio + animatable metadata",
    observation: notApplicable("presentation metadata cannot influence strategic decisions"),
    proposer: notApplicable("presentation metadata has no gameplay utility"),
    command: notApplicable("presentation follows applied gameplay state"),
    outcome: notApplicable("presentation completion is not a gameplay outcome"),
    save: notApplicable("presentation is reconstructed from canonical world state"),
    debug: planned(13, "human-readable object labels only"),
    fixture: planned(15, "debug label/render isolation")
  }
];
