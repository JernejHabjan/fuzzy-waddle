/** Coverage state for one capability seam. Planned entries name their owning stage explicitly. */
export type AiCapabilityCoverageDisposition =
  | { readonly status: "implemented"; readonly symbol: string }
  | { readonly status: "planned"; readonly stage: number; readonly symbol: string }
  | { readonly status: "unsupported"; readonly reason: string }
  | { readonly status: "not_applicable"; readonly reason: string };

/** One researched component family traced through every end-to-end AI seam. */
export interface AiCapabilityCoverageEntry {
  readonly family: string;
  readonly source: string;
  readonly observation: AiCapabilityCoverageDisposition;
  readonly proposer: AiCapabilityCoverageDisposition;
  readonly command: AiCapabilityCoverageDisposition;
  readonly outcome: AiCapabilityCoverageDisposition;
  readonly save: AiCapabilityCoverageDisposition;
  readonly debug: AiCapabilityCoverageDisposition;
  readonly fixture: AiCapabilityCoverageDisposition;
}

const implemented = (symbol: string): AiCapabilityCoverageDisposition => ({ status: "implemented", symbol });
const planned = (stage: number, symbol: string): AiCapabilityCoverageDisposition => ({
  status: "planned",
  stage,
  symbol
});
const notApplicable = (reason: string): AiCapabilityCoverageDisposition => ({ status: "not_applicable", reason });

function gameplayFamily(
  family: string,
  source: string,
  proposerStage: number,
  fixtureStage: number
): AiCapabilityCoverageEntry {
  return {
    family,
    source,
    observation: implemented("AiObservedActor/AiCapabilityCatalogEntry"),
    proposer: implemented(`${family} proposer (Stage ${proposerStage})`),
    command: implemented("GameCommand + CommandBusService shared application"),
    outcome: implemented("adaptGameCommandOutcomeToBrain"),
    save: implemented("command authority/effect save and recovery adapters"),
    debug: implemented(`${family} debug projection (Stage ${Math.max(6, proposerStage)})`),
    fixture: planned(
      15,
      `${family} runtime fixture; authored Stage ${fixtureStage} coverage is deferred to final execution`
    )
  };
}

function stage13CombatFamily(family: string, source: string, proposer: string): AiCapabilityCoverageEntry {
  return {
    family,
    source,
    observation: implemented("AiObservedActor.combatProfile from effective runtime definitions/components"),
    proposer: implemented(proposer),
    command: implemented("AiIntent attack/heal/cast through PlayerAiController shared CommandBusService dispatch"),
    outcome: implemented("AiCommandOutcome reconciliation and persisted effect identity"),
    save: implemented("AiBrainState.squads.tactics/support canonical state"),
    debug: implemented("AiDebugSnapshot.skirmish.squads/support and Squads & Support panel"),
    fixture: planned(15, `ai-tactics-manager.spec.ts plus real ${family} runtime scenario`)
  };
}

/**
 * Stage 2 coverage authority. It inventories prefab component/system families and explicit
 * scenario/editor injection so later stages cannot silently omit a mechanic.
 */
export const AI_CAPABILITY_COVERAGE_MANIFEST: readonly AiCapabilityCoverageEntry[] = [
  gameplayFamily("ownership_diplomacy", "owner + player/team rules", 4, 4),
  gameplayFamily("logical_position_clearance", "representable + collider", 10, 10),
  {
    family: "base_identity_expansion_placement",
    source: "main-building definition metadata + shared construction footprint authority",
    observation: implemented("AiObservedActor.mainBuilding and committed logical/access facts"),
    proposer: implemented("AiBaseManager stable base/expansion lifecycle"),
    command: implemented("CONSTRUCT through CommandBusService and SharedCommandApplicationService"),
    outcome: implemented("shared construction outcome reconciliation"),
    save: implemented("AiBrainState.bases canonical lifecycle and site cooldowns"),
    debug: implemented("AiDebugSnapshot.bases and Bases & Placement panel"),
    fixture: planned(15, "PLACE-01..03, EXP-01..02 and multi-base runtime fixture")
  },
  {
    family: "fortification_topology",
    source: "Wall/WatchTower/Stairs definitions + height navigation + shared construction authority",
    observation: implemented("AiCapabilityCatalogEntry.constructionProfile and AiObservedMap.constructionCells"),
    proposer: implemented("AiFortificationManager persistent bounded graph"),
    command: implemented("CONSTRUCT and breach MOVE through CommandBusService"),
    outcome: implemented("stable node effect reconciliation and observed finished actor matching"),
    save: implemented("AiBrainState.fortifications canonical graph/budget/breach state"),
    debug: implemented("AiDebugSnapshot.fortifications and saved Bases & Placement overlay"),
    fixture: planned(15, "WALL-01..05, H-27/H-28 and real height-topology runtime fixtures")
  },
  {
    family: "causal_recovery_and_anti_blocking",
    source: "committed outcomes, permitted topology and worker/source observations",
    observation: implemented("AiObservedActor.healthPermille plus existing owned resource/access facts"),
    proposer: implemented("AiRecoveryManager bounded recovery ladder"),
    command: implemented("shared gather/attack/repair commands through CommandBusService"),
    outcome: implemented("AiCommandOutcome terminal outcome site backoff"),
    save: implemented("AiBrainState.recovery canonical records"),
    debug: implemented("AiDebugSnapshot.recovery and Logistics & Workers panel"),
    fixture: planned(15, "WALL-04, DOMAIN-04, FIGHT-05, H-01..05 and H-16..18 runtime fixtures")
  },
  gameplayFamily("vision_visibility", "vision + visibility systems", 4, 4),
  stage13CombatFamily("health_regeneration", "health + healthRegeneration", "estimateAiEngagement passive sustain"),
  stage13CombatFamily(
    "attack_target_domains",
    "attack + effective level overrides",
    "AiTacticsManager domain-compatible focus and damage reservations"
  ),
  stage13CombatFamily("healing", "healing", "AiTacticsManager capped missing-health reservation"),
  stage13CombatFamily(
    "spell_status_zone",
    "spell + spellCasting + active effects",
    "AiTacticsManager cooldown/research/autocast/zone-aware support"
  ),
  gameplayFamily("construction", "builder + constructable + prerequisites", 7, 7),
  gameplayFamily("production_queue", "production + queue + productionCost", 7, 7),
  {
    family: "research",
    source: "researchDefinitions + ResearchComponent + TechTreeService shared queue",
    observation: implemented("AiObservation.researchCandidates runtime-legal projection"),
    proposer: implemented("AiAdaptationManager benefit/cost/queue/survival scoring"),
    command: implemented("AiIntent research through PlayerAiController CommandBusService dispatch"),
    outcome: implemented("AiCommandOutcome reconciliation plus TechTreeService resolved runtime level"),
    save: implemented("AiBrainState.economyProduction.adaptation and existing research queue/save"),
    debug: implemented("AiDebugSnapshot.adaptation and Production & Tech panel"),
    fixture: planned(15, "stage-14-adaptation authored cases plus TECH-01..06 runtime matrix")
  },
  gameplayFamily("housing", "housing + housingCost + spawn clearance", 7, 7),
  gameplayFamily("gathering", "gatherer + resourceSource", 7, 7),
  gameplayFamily("resource_drain", "resourceDrain", 7, 7),
  gameplayFamily("growth_tending", "tendable + crop growth state", 7, 7),
  gameplayFamily("ground_navigation", "navigable + translatable + movement", 8, 8),
  gameplayFamily("water_navigation", "shipAnimatable + water navigation", 8, 8),
  gameplayFamily("flight", "flying + air navigation", 8, 8),
  gameplayFamily("container_transport", "container + containable", 8, 8),
  {
    family: "level_overrides",
    source: "actor-level-utils + TechTreeService resolved unit levels",
    observation: implemented("AiObservedActor.effectiveLevel and runtime research candidate benefit"),
    proposer: implemented("AiAdaptationManager beneficiary scoring"),
    command: implemented("RESEARCH via shared command authority"),
    outcome: implemented("ResearchComponent upgrades existing actors; observation resolves new effective levels"),
    save: implemented("existing TechTreeService/research queue save plus adaptation rationale"),
    debug: implemented("AiDebugSnapshot.adaptation selected research rationale"),
    fixture: planned(15, "TECH-01/06 applied-level runtime counterpart")
  },
  gameplayFamily("conversion", "convertible runtime component", 4, 4),
  {
    family: "mode_goals_results",
    source: "GameModeConditionChecker",
    observation: implemented("AiObservation.modeGoals committed mode status"),
    proposer: implemented("AiSkirmishManager mode/recoverability evaluator"),
    command: implemented("GameCommand CONCEDE through CommandBusService.dispatchAi"),
    outcome: implemented("shared command outcome reconciliation"),
    save: implemented("AiBrainState.skirmish.mode canonical state"),
    debug: implemented("AiDebugSnapshot.skirmish.mode"),
    fixture: planned(15, "Stage 9 runtime score/concession fixture")
  },
  {
    family: "scenario_editor_injected_conversion",
    source: "scenario/editor actor conversion and ownership events",
    observation: implemented("AiObservation evidence/ownership contract"),
    proposer: implemented("knowledge/diplomacy reducer (Stage 4)"),
    command: notApplicable("conversion is caused by ordinary runtime proximity, never an AI ownership command"),
    outcome: implemented("ConvertibleComponent.ConvertedEvent"),
    save: implemented("ConvertibleComponentData accumulatedTime/converted"),
    debug: implemented("conversion evidence projection (Stage 4)"),
    fixture: planned(15, "scenario/editor injected conversion runtime bridge")
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
