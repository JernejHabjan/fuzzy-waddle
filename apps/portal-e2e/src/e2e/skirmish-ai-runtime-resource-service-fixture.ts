import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { OrderType, ResourceType, type GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiGatheringSelection } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/planning/ai-gathering-selection";
import type { AiRuntimeProductionCaptureV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeResourceCoverageV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-resource-coverage-v1";
import type { AiRuntimeResourceServiceIntervalV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-resource-service-interval-v1";
import { resourceCreditFixture } from "./skirmish-ai-runtime-resource-credit-fixture";

/** Synthetic exact accounting/control shapes only; every useful/capacity verdict must still be unavailable. */
export function resourceServiceFixture() {
  const f = resourceCreditFixture();
  const selected = f.capture.facts.find(
    (fact) =>
      fact.kind === "decision_selected" &&
      fact.decision.acceptedIntents.some((intent) => intent.intentId === "intent:service")
  );
  if (!selected || selected.kind !== "decision_selected" || f.command.type !== "ACTOR_ACTION") {
    throw new Error("resource_service_fixture_selection_missing");
  }
  const previousIntent = selected.decision.acceptedIntents[0];
  if (!previousIntent) throw new Error("resource_service_fixture_intent_missing");
  const intent = {
    ...previousIntent,
    kind: "assign_gatherers",
    demandId: null,
    actorIds: [f.product.actorId ?? ""],
    resourceType: ResourceType.Wood,
    sourceActorId: f.producer.actorId ?? ""
  } satisfies AiIntentV1;
  const command = {
    ...f.command,
    orderType: OrderType.Gather,
    tileVec3: undefined,
    targetObjectIds: [f.producer.actorId ?? ""]
  } satisfies GameCommand;
  const selection = {
    intentId: intent.intentId,
    effectId: intent.effectId,
    playerNumber: 1,
    tick: 10,
    observationGeneration: 1,
    catalogGeneration: 1,
    branch: "forecast",
    resourceType: ResourceType.Wood,
    forecast: { amount: 102, horizonTick: 30, confidencePermille: 800 },
    plannerDeficit: 2,
    ledger: {
      resourceType: ResourceType.Wood,
      stockpile: 100,
      reservedUnspent: 0,
      obligationsDue: 0,
      deliveredIncomePerMinute: { status: "known", value: 0, observedTick: 10 }
    }
  } satisfies AiGatheringSelection;
  const order = { ...f.currentOrder, orderType: OrderType.Gather, target: f.producer, targetTile: null };
  const facts = f.capture.facts.map((fact): AiRuntimeProductionFactV1 => {
    if (fact.kind === "decision_selected")
      return {
        ...fact,
        decision: {
          ...fact.decision,
          gatheringSelections: fact === selected ? [selection] : [],
          ...(fact === selected
            ? {
                acceptedIntents: [intent],
                decisions: [{ intent, reason: "accepted", outcome: "accepted" }],
                economyProduction: {
                  ...fact.decision.economyProduction,
                  forecasts: [
                    { resourceType: ResourceType.Wood, amount: 999, horizonTick: 610, confidencePermille: 800 }
                  ],
                  demands: []
                }
              }
            : {})
        }
      };
    if (
      fact.kind === "intent_dispatch" &&
      fact.event.kind === "requested" &&
      fact.event.acceptedIntent?.intentId === intent.intentId
    )
      return { ...fact, event: { ...fact.event, acceptedIntent: intent, command } };
    if (
      fact.kind === "intent_dispatch" &&
      fact.event.kind === "finished" &&
      fact.event.receipt.status === "dispatched" &&
      fact.event.receipt.command.execution?.commandId === "service"
    )
      return { ...fact, event: { ...fact.event, receipt: { status: "dispatched", command } } };
    if (fact.kind === "command_delivered" && fact.command.execution?.commandId === "service")
      return { ...fact, command };
    if (fact.kind !== "spatial_authority") return fact;
    const value = fact.spatial;
    if (value.kind === "route_order") return { ...fact, spatial: { ...value, order } };
    if (value.kind === "service_attempt")
      return {
        ...fact,
        spatial: {
          ...value,
          order: { ...order, orderType: value.operation === "gather" ? OrderType.Gather : OrderType.ReturnResources }
        }
      };
    if (value.kind === "resource_service" && value.phase === "resource_credit")
      return { ...fact, spatial: { ...value, ownerArgument: 1, beneficiary: 1 } };
    if (value.kind === "producer_path") return { ...fact, spatial: { ...value, currentOrder: order } };
    return fact;
  });
  const beforeExecution = facts.find(
    (fact) =>
      fact.kind === "spatial_authority" && fact.spatial.kind === "service_attempt" && fact.spatial.phase === "started"
  );
  if (!beforeExecution) throw new Error("resource_service_fixture_execution_missing");
  const boundary = beforeExecution.sequence - 1,
    finalSequence = facts.at(-1)?.sequence ?? 0;
  const coverage = (tick: number, sequence: number): AiRuntimeResourceCoverageV1 => ({
    captureEpoch: 1,
    lossEpoch: 0,
    startedTick: f.capture.startedTick,
    frontier: { tick, captureSequence: sequence },
    lost: false,
    losses: [],
    gaps: [],
    cohorts: [
      {
        cohortId: 1,
        actorId: f.product.actorId ?? "",
        playerNumber: 1,
        installed: { tick: f.capture.startedTick, captureSequence: 0 },
        channels: ["cargo", "credit"]
      }
    ]
  });
  const interval = {
    intervalId: "retained",
    beneficiary: 1,
    resourceType: ResourceType.Wood,
    actorIds: [f.product.actorId ?? ""],
    need: { intentId: intent.intentId, effectId: intent.effectId, selectedTick: 10 },
    startTick: 10,
    endTick: 30,
    runCeilingTick: 30,
    windowTicks: 10,
    minimumUsefulDelivery: 1
  } satisfies AiRuntimeResourceServiceIntervalV1;
  const template: AiRuntimeProductionCaptureV1["snapshots"][number] = {
    tick: 10,
    observation: null,
    capabilityCatalog: null,
    economyProduction: null,
    reservations: [],
    ownedActors: [{ actorId: f.product.actorId ?? "", objectName: f.product.objectName }],
    resources: { food: 100, wood: 100, stone: 100, minerals: 100 },
    pendingCommands: [],
    pendingResourceClaims: null,
    obligations: { food: 0, wood: 0, stone: 0, minerals: 0 },
    queues: [],
    completedResearch: []
  };
  const capture = {
    ...f.capture,
    facts,
    resourceCoverage: coverage(30, finalSequence),
    resourceIntervalDeclaration: {
      boundary: { tick: f.capture.startedTick, captureSequence: 0 },
      overflow: false,
      intervals: [interval]
    },
    snapshots: [10, 20, 30].map((tick) => ({
      ...template,
      tick,
      afterSequence: tick === 10 ? boundary : finalSequence,
      resourceCoverage: coverage(tick, tick === 10 ? boundary : finalSequence)
    }))
  } satisfies AiRuntimeProductionCaptureV1;
  return { capture, interval, selection, coverage, boundary, finalSequence };
}
