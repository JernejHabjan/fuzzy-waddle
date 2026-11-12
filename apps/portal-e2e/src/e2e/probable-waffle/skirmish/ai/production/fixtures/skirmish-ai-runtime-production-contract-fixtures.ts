import type { RuntimeProductionContract } from "../lifecycle/skirmish-ai-runtime-production-contract";
import type { RuntimeProductionEvidence } from "../evidence/skirmish-ai-runtime-production-evidence";

/** Synthetic oracle-only records, never browser outcome evidence or preset-world injection. */
export function productionContract(
  scenarioId: RuntimeProductionContract["scenarioId"], branch: RuntimeProductionContract["branch"]
): RuntimeProductionContract {
  return { scenarioId, branch, latestTick: 600, stableForTicks: 200, producerObjectName: "AnkGuard",
    productKey: "TivaraMacemanMale", pairId: `${scenarioId}:pair` };
}

export function productionSnapshot(tick: number): RuntimeProductionEvidence["snapshots"][number] {
  return { tick, transition: null, leases: [], usefulDemand: 2, completedResearchKeys: [],
    producers: [proofProducer("producer-1", 4)], products: [],
    visibleThreats: [{ actorId: "visible-attacker", observedTick: tick, position: { x: 5, y: 5 }, buildingRange: 3 }] };
}

export function proofProducer(actorId: string, x: number): RuntimeProductionEvidence["snapshots"][number]["producers"][number] {
  return { actorId, objectName: "AnkGuard", ready: true, reachable: true, position: { x, y: 5 },
    lanes: [{ laneId: "shared-0", capacity: 2, itemIds: [] }] };
}

export function productionEvent(
  sequence: number, tick: number, kind: RuntimeProductionEvidence["events"][number]["kind"],
  extra: Partial<RuntimeProductionEvidence["events"][number]> = {}
): RuntimeProductionEvidence["events"][number] {
  return { sequence, tick, kind, commandId: `command:${sequence}`, effectId: `effect:${sequence}`, planId: "future-plan",
    actorId: "producer-1", productKey: "TivaraMacemanMale", itemId: null, laneId: null, createdActorId: null,
    resourcesBefore: { wood: 100 }, resourcesAfter: { wood: 100 }, reservedUnspent: { wood: 0 },
    obligationsDue: { wood: 0 }, obligationsAfter: { wood: 0 }, charged: { wood: 0 },
    refundForItemId: null, refundAmounts: {}, ...extra };
}

export function productionEvidence(
  snapshots: RuntimeProductionEvidence["snapshots"], events: RuntimeProductionEvidence["events"]
): RuntimeProductionEvidence {
  return { pairedSetupDigest: "sha256:causal-world", initialProducerIds: ["producer-1"], initialProductActorIds: [],
    initialPaidItemIds: [], catalog: [
      { productKey: "AnkGuard", kind: "construction", cost: { wood: 50 }, payment: "immediate", durationTicks: 50 },
      { productKey: "TivaraMacemanMale", kind: "production", cost: { wood: 35 }, payment: "immediate", durationTicks: 100 },
      { productKey: "useful-research", kind: "research", cost: { wood: 20 }, payment: "immediate", durationTicks: 50 }
    ], snapshots, events };
}
