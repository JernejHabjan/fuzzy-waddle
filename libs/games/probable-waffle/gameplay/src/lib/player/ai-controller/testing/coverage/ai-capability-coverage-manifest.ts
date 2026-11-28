import type { AiCapabilityCoverageDisposition } from "./contracts/ai-capability-coverage-disposition";
export type { AiCapabilityCoverageDisposition } from "./contracts/ai-capability-coverage-disposition";

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
const planned = (owner: string, symbol: string): AiCapabilityCoverageDisposition => ({
  status: "planned",
  owner,
  symbol
});
const notApplicable = (reason: string): AiCapabilityCoverageDisposition => ({ status: "not_applicable", reason });

function gameplayFamily(family: string, source: string): AiCapabilityCoverageEntry {
  return {
    family,
    source,
    observation: implemented("AiObservedActor/AiCapabilityCatalogEntry"),
    proposer: implemented(`${family} proposer`),
    command: implemented("GameCommand + CommandBusService shared application"),
    outcome: implemented("adaptGameCommandOutcomeToBrain"),
    save: implemented("command authority/effect save and recovery adapters"),
    debug: implemented(`${family} debug projection`),
    fixture: planned(
      "native scenario evidence",
      `${family} runtime fixture; authored coverage requires native execution`
    )
  };
}

function combatFamily(family: string, source: string, proposer: string): AiCapabilityCoverageEntry {
  return {
    family,
    source,
    observation: implemented("AiObservedActor.combatProfile from effective runtime definitions/components"),
    proposer: implemented(proposer),
    command: implemented("AiIntent attack/heal/cast through PlayerAiController shared CommandBusService dispatch"),
    outcome: implemented("AiCommandOutcome reconciliation and persisted effect identity"),
    save: implemented("AiBrainState.squads.tactics/support canonical state"),
    debug: implemented("AiDebugSnapshot.skirmish.squads/support and Squads & Support panel"),
    fixture: planned("native scenario evidence", `ai-tactics-manager.spec.ts plus real ${family} runtime scenario`)
  };
}

/**
 * Capability coverage authority. It inventories prefab component/system families and explicit
 * scenario/editor injection so later owners cannot silently omit a mechanic.
 */
export const AI_CAPABILITY_COVERAGE_MANIFEST: readonly AiCapabilityCoverageEntry[] = [
  gameplayFamily("ownership_diplomacy", "owner + player/team rules"),
  gameplayFamily("logical_position_clearance", "representable + collider"),
  {
    family: "base_identity_expansion_placement",
    source: "main-building definition metadata + shared construction footprint authority",
    observation: implemented("AiObservedActor.mainBuilding and committed logical/access facts"),
    proposer: implemented("AiBaseManager stable base/expansion lifecycle"),
    command: implemented("CONSTRUCT through CommandBusService and SharedCommandApplicationService"),
    outcome: implemented("shared construction outcome reconciliation"),
    save: implemented("AiBrainState.bases canonical lifecycle and site cooldowns"),
    debug: implemented("AiDebugSnapshot.bases and Bases & Placement panel"),
    fixture: planned("native scenario evidence", "PLACE-01..03, EXP-01..02 and multi-base runtime fixture")
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
    fixture: planned("native scenario evidence", "WALL-01..05, H-27/H-28 and real height-topology runtime fixtures")
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
    fixture: planned("native scenario evidence", "WALL-04, DOMAIN-04, FIGHT-05, H-01..05 and H-16..18 runtime fixtures")
  },
  gameplayFamily("vision_visibility", "vision + visibility systems"),
  combatFamily("health_regeneration", "health + healthRegeneration", "estimateAiEngagement passive sustain"),
  combatFamily(
    "attack_target_domains",
    "attack + effective level overrides",
    "AiTacticsManager domain-compatible focus and damage reservations"
  ),
  combatFamily("healing", "healing", "AiTacticsManager capped missing-health reservation"),
  combatFamily(
    "spell_status_zone",
    "spell + spellCasting + active effects",
    "AiTacticsManager cooldown/research/autocast/zone-aware support"
  ),
  gameplayFamily("construction", "builder + constructable + prerequisites"),
  gameplayFamily("production_queue", "production + queue + productionCost"),
  {
    family: "research",
    source: "researchDefinitions + ResearchComponent + TechTreeService shared queue",
    observation: implemented("AiObservation.researchCandidates runtime-legal projection"),
    proposer: implemented("AiAdaptationManager benefit/cost/queue/survival scoring"),
    command: implemented("AiIntent research through PlayerAiController CommandBusService dispatch"),
    outcome: implemented("AiCommandOutcome reconciliation plus TechTreeService resolved runtime level"),
    save: implemented("AiBrainState.economyProduction.adaptation and existing research queue/save"),
    debug: implemented("AiDebugSnapshot.adaptation and Production & Tech panel"),
    fixture: planned("native scenario evidence", "stage-14-adaptation authored cases plus TECH-01..06 runtime matrix")
  },
  gameplayFamily("housing", "housing + housingCost + spawn clearance"),
  gameplayFamily("gathering", "gatherer + resourceSource"),
  gameplayFamily("resource_drain", "resourceDrain"),
  gameplayFamily("growth_tending", "tendable + crop growth state"),
  gameplayFamily("ground_navigation", "navigable + translatable + movement"),
  gameplayFamily("water_navigation", "shipAnimatable + water navigation"),
  gameplayFamily("flight", "flying + air navigation"),
  gameplayFamily("container_transport", "container + containable"),
  {
    family: "level_overrides",
    source: "actor-level-utils + TechTreeService resolved unit levels",
    observation: implemented("AiObservedActor.effectiveLevel and runtime research candidate benefit"),
    proposer: implemented("AiAdaptationManager beneficiary scoring"),
    command: implemented("RESEARCH via shared command authority"),
    outcome: implemented("ResearchComponent upgrades existing actors; observation resolves new effective levels"),
    save: implemented("existing TechTreeService/research queue save plus adaptation rationale"),
    debug: implemented("AiDebugSnapshot.adaptation selected research rationale"),
    fixture: planned("native scenario evidence", "TECH-01/06 applied-level runtime counterpart")
  },
  gameplayFamily("conversion", "convertible runtime component"),
  {
    family: "mode_goals_results",
    source: "GameModeConditionChecker",
    observation: implemented("AiObservation.modeGoals committed mode status"),
    proposer: implemented("AiSkirmishManager mode/recoverability evaluator"),
    command: implemented("GameCommand CONCEDE through CommandBusService.dispatchAi"),
    outcome: implemented("shared command outcome reconciliation"),
    save: implemented("AiBrainState.skirmish.mode canonical state"),
    debug: implemented("AiDebugSnapshot.skirmish.mode"),
    fixture: planned("native scenario evidence", "skirmish runtime score/concession fixture")
  },
  {
    family: "scenario_editor_injected_conversion",
    source: "scenario/editor actor conversion and ownership events",
    observation: implemented("AiObservation evidence/ownership contract"),
    proposer: implemented("knowledge/diplomacy reducer (observation)"),
    command: notApplicable("conversion is caused by ordinary runtime proximity, never an AI ownership command"),
    outcome: implemented("ConvertibleComponent.ConvertedEvent"),
    save: implemented("ConvertibleComponentData accumulatedTime/converted"),
    debug: implemented("conversion evidence projection (observation)"),
    fixture: planned("native scenario evidence", "scenario/editor injected conversion runtime bridge")
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
    fixture: planned("native scenario evidence", "debug label/render isolation")
  }
];
