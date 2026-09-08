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

function stage13CombatFamily(family: string, source: string, proposer: string): AiCapabilityCoverageEntryV1 {
  return {
    family,
    source,
    observation: implemented("AiObservedActorV1.combatProfile from effective runtime definitions/components"),
    proposer: implemented(proposer),
    command: implemented("AiIntentV1 attack/heal/cast through PlayerAiController shared CommandBusService dispatch"),
    outcome: implemented("AiCommandOutcomeV1 reconciliation and persisted effect identity"),
    save: implemented("AiBrainStateV1.squads.tactics/support canonical state"),
    debug: implemented("AiDebugSnapshotV1.skirmish.squads/support and Squads & Support panel"),
    fixture: planned(15, `ai-stage-13-tactics-manager.spec.ts plus real ${family} runtime scenario`)
  };
}

/**
 * Stage 2 coverage authority. It inventories prefab component/system families and explicit
 * scenario/editor injection so later stages cannot silently omit a mechanic.
 */
export const AI_CAPABILITY_COVERAGE_MANIFEST_V1: readonly AiCapabilityCoverageEntryV1[] = [
  gameplayFamily("ownership_diplomacy", "owner + player/team rules", 4, 4),
  gameplayFamily("logical_position_clearance", "representable + collider", 10, 10),
  {
    family: "base_identity_expansion_placement",
    source: "main-building definition metadata + shared construction footprint authority",
    observation: implemented("AiObservedActorV1.mainBuilding and committed logical/access facts"),
    proposer: implemented("AiStage10BaseManagerV1 stable base/expansion lifecycle"),
    command: implemented("CONSTRUCT through CommandBusService and SharedCommandApplicationService"),
    outcome: implemented("shared construction outcome reconciliation"),
    save: implemented("AiBrainStateV1.bases canonical lifecycle and site cooldowns"),
    debug: implemented("AiDebugSnapshotV1.bases and Bases & Placement panel"),
    fixture: planned(15, "PLACE-01..03, EXP-01..02 and multi-base runtime fixture")
  },
  {
    family: "fortification_topology",
    source: "Wall/WatchTower/Stairs definitions + height navigation + shared construction authority",
    observation: implemented("AiCapabilityCatalogEntryV1.constructionProfile and AiObservedMapV1.constructionCells"),
    proposer: implemented("AiStage11FortificationManagerV1 persistent bounded graph"),
    command: implemented("CONSTRUCT and breach MOVE through CommandBusService"),
    outcome: implemented("stable node effect reconciliation and observed finished actor matching"),
    save: implemented("AiBrainStateV1.fortifications canonical graph/budget/breach state"),
    debug: implemented("AiDebugSnapshotV1.fortifications and saved Bases & Placement overlay"),
    fixture: planned(15, "WALL-01..05, H-27/H-28 and real height-topology runtime fixtures")
  },
  {
    family: "causal_recovery_and_anti_blocking",
    source: "committed outcomes, permitted topology and worker/source observations",
    observation: implemented("AiObservedActorV1.healthPermille plus existing owned resource/access facts"),
    proposer: implemented("AiStage12RecoveryManagerV1 bounded recovery ladder"),
    command: implemented("shared gather/attack/repair commands through CommandBusService"),
    outcome: implemented("AiCommandOutcomeV1 terminal outcome site backoff"),
    save: implemented("AiBrainStateV1.recovery canonical records"),
    debug: implemented("AiDebugSnapshotV1.recovery and Logistics & Workers panel"),
    fixture: planned(15, "WALL-04, DOMAIN-04, FIGHT-05, H-01..05 and H-16..18 runtime fixtures")
  },
  gameplayFamily("vision_visibility", "vision + visibility systems", 4, 4),
  stage13CombatFamily("health_regeneration", "health + healthRegeneration", "estimateAiEngagementV1 passive sustain"),
  stage13CombatFamily("attack_target_domains", "attack + effective level overrides", "AiStage13TacticsManagerV1 domain-compatible focus and damage reservations"),
  stage13CombatFamily("healing", "healing", "AiStage13TacticsManagerV1 capped missing-health reservation"),
  stage13CombatFamily("spell_status_zone", "spell + spellCasting + active effects", "AiStage13TacticsManagerV1 cooldown/research/autocast/zone-aware support"),
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
  {
    family: "mode_goals_results",
    source: "GameModeConditionChecker",
    observation: implemented("AiObservationV1.modeGoals committed mode status"),
    proposer: implemented("AiStage9SkirmishManagerV1 mode/recoverability evaluator"),
    command: implemented("GameCommand CONCEDE through CommandBusService.dispatchAi"),
    outcome: implemented("shared command outcome reconciliation"),
    save: implemented("AiBrainStateV1.skirmish.mode canonical state"),
    debug: implemented("AiDebugSnapshotV1.skirmish.mode"),
    fixture: planned(15, "Stage 9 runtime score/concession fixture")
  },
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
    debug: implemented("AI debug panels render source-provided labels only as Phaser text"),
    fixture: planned(15, "debug label/render isolation")
  }
];
