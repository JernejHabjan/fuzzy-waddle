import type { AiCapabilityCatalogV1, AiObservationV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { isSnapshotApplyInProgress } from "../../data/scene-data";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import { AI_DECISION_DISPATCH_EVENT } from "./ai-decision-dispatch-event";
import type { AiDecisionInputV1 } from "./ai-decision-input-v1";

/** Passive listener-gated projection: no actor scan, navigation query, timer, saved state or ordinary-game clone. */
export function captureAiDecisionInput(
  scene: ProbableWaffleScene, observation: AiObservationV1, catalog: AiCapabilityCatalogV1 | undefined,
  intervalMs: number, completedBefore: number
): AiDecisionInputV1 | undefined {
  if (!scene.events.listenerCount(AI_DECISION_DISPATCH_EVENT)) return undefined;
  const gaps: string[] = [];
  const ticks = getSceneService(scene, SimulationTickService);
  const bounded = observation.actors.length <= 256 && observation.accessProducts.length <= 64 &&
    observation.actors.every((actor) => actor.capabilities.length <= 64 &&
      (actor.combatProfile?.status !== "known" || actor.combatProfile.value.attacks.length <= 32));
  if (!bounded) gaps.push("production_decision_observation_overflow");
  const graph = observation.map?.accessGraph;
  const boundedGraph = graph && graph.nodes.length <= 512 && graph.links.length <= 2048 &&
    graph.transferPoints.length <= 512 && graph.unknownNodeIds.length <= 512;
  if (graph && !boundedGraph) gaps.push("production_decision_graph_overflow");
  const boundedCatalog = catalog && catalog.entries.length <= 512 && catalog.unsupported.length <= 512;
  if (catalog && !boundedCatalog) gaps.push("production_decision_catalog_overflow");
  return {
    observation: bounded ? { schemaVersion: observation.schemaVersion, generation: observation.generation,
      tick: observation.tick, playerNumber: observation.playerNumber, faction: observation.faction,
      actors: observation.actors, accessProducts: observation.accessProducts, threatSummary: observation.threatSummary } : null,
    capabilityCatalog: boundedCatalog ? catalog : null, accessGraph: boundedGraph ? graph : null,
    cadence: { clock: ticks ? "simulation" : "render_fallback", tick: ticks?.currentTick ?? null,
      configuredIntervalTicks: intervalMs / SimulationTickService.TICK_INTERVAL_MS, completedBefore },
    snapshotRestoreInProgress: isSnapshotApplyInProgress(scene), gaps
  };
}
