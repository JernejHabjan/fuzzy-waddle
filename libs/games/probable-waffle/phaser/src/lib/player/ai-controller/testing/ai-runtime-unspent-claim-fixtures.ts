import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-profile-defaults";
import type { AiDecisionDispatchEvent } from "../ai-decision-dispatch-event";
import type { AiRuntimeQueueResourceV1 } from "./ai-runtime-queue-resource-v1";
import { pendingCommandIntent, pendingCommandRequest, pendingCommandFinished } from "./ai-runtime-pending-command-fixtures";

/** Invented contracts, never runtime proof; retain native-shaped leases, request scope and full payment samples. */
export function unspentClaimFixture() {
  const intent = pendingCommandIntent();
  const state = createAiBrainStateV1({ playerNumber: 2, faction: FactionType.Tivara, tick: 100, archetypeId: "balanced",
    profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium) });
  const decision = { identity: { playerNumber: 2, tick: 100, generation: 7, decisionSequence: 1, authorityEpoch: 1 },
    acceptedIntents: [intent], decisions: [{ intent, outcome: "accepted", reason: "accepted" }],
    economyProduction: state.economyProduction, reservations: intent.claims.flatMap((claim) => claim.kind === "resource" ? [{
      claimId: claim.claimId, ownerPlanId: intent.planId, subjectKey: `resource:${claim.resourceType}`, createdTick: 100,
      prerequisites: [], state: { kind: "provisional" as const,
        expiresAt: { clock: "simulation" as const, unit: "tick" as const, dueTick: 120, persistence: "save" as const } }
    }] : []) } satisfies AiDecisionDispatchEvent;
  const request = { ...pendingCommandRequest(), acceptedIntent: intent, decisionIdentity: decision.identity };
  const receipt = pendingCommandFinished();
  if (receipt.receipt.status !== "dispatched" || !receipt.receipt.command.execution) throw new Error("synthetic_stamp_missing");
  const resource = { actorId: "producer", ownerNumber: 2, itemId: `queue:producer:${receipt.receipt.command.execution.commandId}`,
    identitySource: "command", operation: "immediate_charge", objectName: intent.kind === "produce" ? intent.objectName : null,
    researchType: null, totalTimeMs: 150, remainingTimeMs: 150, payment: "immediate", storedPrice: { food: 35 }, refundFactor: 1,
    originatingCommandContext: { playerNumber: 2, actorIds: ["producer"], execution: receipt.receipt.command.execution },
    cancellationCommand: null, gaps: [], emission: { operationId: 1, phase: "started", requested: { food: 35 },
      before: { food: 100, wood: 100, stone: 100, minerals: 100 }, snapshotRestoreInProgress: false }
  } satisfies AiRuntimeQueueResourceV1;
  return { intent, decision, request, receipt, resource };
}
