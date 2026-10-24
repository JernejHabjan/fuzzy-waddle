import type { RuntimeProductionContractV1 } from "./skirmish-ai-runtime-production-contract";
import type { RuntimeProductionEvidenceV1 } from "./skirmish-ai-runtime-production-evidence";

/** Synthetic oracle-only records, never browser outcome evidence or preset-world injection. */
export function productionContract(
  scenarioId: RuntimeProductionContractV1["scenarioId"], branch: RuntimeProductionContractV1["branch"]
): RuntimeProductionContractV1 {
  return { scenarioId, branch, latestTick: 600, stableForTicks: 200, producerObjectName: "AnkGuard",
    productKey: "TivaraMacemanMale", pairId: `${scenarioId}:pair` };
}

export function productionSnapshot(tick: number): RuntimeProductionEvidenceV1["snapshots"][number] {
  return { tick, transition: null, leases: [], usefulDemand: 2, completedResearchKeys: [],
    producers: [proofProducer("producer-1", 4)], products: [],
    visibleThreats: [{ actorId: "visible-attacker", observedTick: tick, position: { x: 5, y: 5 }, buildingRange: 3 }] };
}

export function proofProducer(actorId: string, x: number): RuntimeProductionEvidenceV1["snapshots"][number]["producers"][number] {
  return { actorId, objectName: "AnkGuard", ready: true, reachable: true, position: { x, y: 5 },
    lanes: [{ laneId: "shared-0", capacity: 2, itemIds: [] }] };
}

export function productionEvent(
  sequence: number, tick: number, kind: RuntimeProductionEvidenceV1["events"][number]["kind"],
  extra: Partial<RuntimeProductionEvidenceV1["events"][number]> = {}
): RuntimeProductionEvidenceV1["events"][number] {
  return { sequence, tick, kind, commandId: `command:${sequence}`, effectId: `effect:${sequence}`, planId: "future-plan",
    actorId: "producer-1", productKey: "TivaraMacemanMale", itemId: null, laneId: null, createdActorId: null,
    resourcesBefore: { wood: 100 }, resourcesAfter: { wood: 100 }, reservedUnspent: { wood: 0 },
    obligationsDue: { wood: 0 }, obligationsAfter: { wood: 0 }, charged: { wood: 0 },
    refundForItemId: null, refundAmounts: {}, ...extra };
}

export function productionEvidence(
  snapshots: RuntimeProductionEvidenceV1["snapshots"], events: RuntimeProductionEvidenceV1["events"]
): RuntimeProductionEvidenceV1 {
  return { pairedSetupDigest: "sha256:causal-world", initialProducerIds: ["producer-1"], initialProductActorIds: [],
    initialPaidItemIds: [], catalog: [
      { productKey: "AnkGuard", kind: "construction", cost: { wood: 50 }, payment: "immediate", durationTicks: 50 },
      { productKey: "TivaraMacemanMale", kind: "production", cost: { wood: 35 }, payment: "immediate", durationTicks: 100 },
      { productKey: "useful-research", kind: "research", cost: { wood: 20 }, payment: "immediate", durationTicks: 50 }
    ], snapshots, events };
}
