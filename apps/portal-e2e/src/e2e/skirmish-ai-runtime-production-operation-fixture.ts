import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { FactionType, ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { createAiBrainStateV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-profile-defaults";
import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeUnspentClaimsV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-unspent-claims-v1";
import { productionProgressFixture } from "./skirmish-ai-runtime-production-progress-fixture";
import { calculateRuntimeQueueLiabilities } from "./skirmish-ai-runtime-queue-liabilities";
/** Invented native-shaped decisions, claims and cash intervals; never a runtime setup or useful AI world. */
export function productionOperationFixture(kind: "immediate" | "tick" | "denied" = "tick", remaining = 100) {
  const { capture, command } = productionProgressFixture(kind === "denied" ? "denied" : "advanced", remaining);
  const identity = { playerNumber: 1, tick: 4, generation: 7, decisionSequence: 1, authorityEpoch: 1 };
  const intent = {
    intentId: "intent:purchase",
    effectId: "effect:purchase",
    planId: "plan:force",
    demandId: "demand:force",
    lane: "supply_production",
    kind: "produce",
    proposedTick: 4,
    urgencyClass: 2,
    utility: 10,
    producerId: "producer",
    objectName: command.actorName,
    preconditions: [],
    claims: [{ kind: "resource", claimId: "claim:purchase:food", resourceType: ResourceType.Food, amount: 7 }],
    reasonCode: "synthetic_force"
  } satisfies AiIntentV1;
  const state = createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    tick: 4,
    archetypeId: "balanced",
    profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium)
  });
  const correlation = { intentId: "purchase", effectId: "purchase", commitmentKey: command.execution.commitmentKey };
  const admission = {
    ...command.execution,
    kind: "dispatched",
    reason: "accepted_for_dispatch",
    tick: 6,
    playerNumber: 1,
    actorIds: ["producer"],
    worldLinkIds: []
  } satisfies Extract<
    AiRuntimeProductionFactV1,
    {
      kind: "outcome";
    }
  >["outcome"];
  const base = { sequence: 0, tick: 4, playerNumber: 1 };
  const facts: AiRuntimeProductionFactV1[] = [
    {
      ...base,
      kind: "decision_selected",
      decision: {
        identity,
        acceptedIntents: [intent],
        decisions: [{ outcome: "accepted", reason: "accepted", intent }],
        economyProduction: state.economyProduction,
        reservations: [
          {
            claimId: "claim:purchase:food",
            ownerPlanId: "plan:force",
            subjectKey: "resource:food",
            createdTick: 4,
            prerequisites: [],
            state: {
              kind: "provisional",
              expiresAt: { clock: "simulation", unit: "tick", persistence: "save", dueTick: 99 }
            }
          }
        ]
      }
    },
    {
      ...base,
      kind: "intent_dispatch",
      event: {
        kind: "requested",
        playerNumber: 1,
        correlation,
        command,
        proposedTick: 4,
        acceptedIntent: intent,
        claims: intent.claims,
        decisionIdentity: identity
      }
    },
    { ...base, kind: "outcome", outcome: admission, scheduledTick: 6 },
    {
      ...base,
      kind: "intent_dispatch",
      event: { kind: "finished", playerNumber: 1, correlation, receipt: { status: "dispatched", command } }
    }
  ];
  const zero = { food: 0, wood: 0, stone: 0, minerals: 0 };
  const ledger = (status: AiRuntimeUnspentClaimsV1["entries"][number]["state"]): AiRuntimeUnspentClaimsV1 => ({
    resources: { ...zero, food: status === "admitted" ? 7 : 0 },
    gaps: [],
    entries: [{ identity, intent, commandId: "purchase", state: status }]
  });
  const start = capture.facts.find((fact) => fact.kind === "queue_progress" && fact.progress.phase === "started");
  const boundary = start?.boundaryState;
  if (!boundary?.queues) throw new Error("synthetic_start_missing");
  const queues = boundary.queues;
  if (kind !== "immediate")
    facts.push(
      { ...base, tick: 6, kind: "queue_changed", queue: requireAiTestEntry(queues, 0) },
      { ...base, tick: 6, kind: "outcome", scheduledTick: null, outcome: { ...admission, kind: "applied", tick: 6 } },
      { ...base, tick: 6, kind: "command_delivered", command }
    );
  const operationFacts: AiRuntimeProductionFactV1[] = capture.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
    if (kind !== "immediate")
      return [
        {
          ...fact,
          boundaryState: fact.boundaryState
            ? {
                ...fact.boundaryState,
                unspentClaims: ledger("queue_liability"),
                pendingResourceClaims: { ...zero, food: 7 }
              }
            : undefined
        }
      ];
    if (fact.kind !== "queue_resource") return [];
    const emission = fact.resource.emission;
    const finish = emission.phase === "finished";
    const callback = emission.phase === "callback";
    const physical = queues.map((queue) => ({
      ...queue,
      lanes: queue.lanes.map((lane) => ({ ...lane, items: lane.items.filter((item) => item.commandId !== "purchase") }))
    }));
    const unspentClaims = callback
      ? { ...ledger("admitted"), resources: null, gaps: ["unspent_payment_in_progress"] }
      : ledger(finish ? "paid" : "admitted");
    return [
      {
        ...fact,
        tick: 6,
        resource: { ...fact.resource, operation: "immediate_charge", payment: "immediate", remainingTimeMs: 150 },
        boundaryState: {
          ...boundary,
          queues: physical,
          obligations: calculateRuntimeQueueLiabilities(physical),
          unspentClaims,
          resources:
            finish && emission.phase === "finished"
              ? emission.after
              : callback
                ? { food: 93, wood: 100, stone: 100, minerals: 100 }
                : boundary.resources,
          pendingResourceClaims: { ...zero, food: 7 },
          gaps: callback ? ["unspent_payment_in_progress", "production_boundary_unspent_reconciliation_missing"] : []
        }
      }
    ];
  });
  facts.push(...operationFacts);
  if (kind === "immediate")
    facts.push(
      {
        ...base,
        tick: 6,
        kind: "queue_changed",
        queue: {
          ...requireAiTestEntry(queues, 0),
          lanes: requireAiTestEntry(queues, 0).lanes.map((lane) => ({
            ...lane,
            items: lane.items.map((item) =>
              item.commandId === "purchase" ? { ...item, payment: "immediate", remainingTimeMs: 150 } : item
            )
          }))
        }
      },
      { ...base, tick: 6, kind: "outcome", scheduledTick: null, outcome: { ...admission, kind: "applied", tick: 6 } },
      { ...base, tick: 6, kind: "command_delivered", command }
    );
  return { ...capture, facts: facts.map((fact, index) => ({ ...fact, sequence: index + 1 })) };
}
