import Phaser from "phaser";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { QueueItemType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { researchDefinitions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/research/research-definitions";
import { ObjectNames, ResearchType, ResourceType, type GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import type { QueueResourceEmissionEvent } from "../../../data/queue-resource-emission-event";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { projectAiRuntimeQueueResource } from "./project-ai-runtime-queue-resource";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));

/** Synthetic callback and command metadata; no actual queue charge/refund or applied command is established here. */
function event(): QueueResourceEmissionEvent {
  jest.mocked(getActorComponent).mockImplementation((_actor, type) => {
    if (type === IdComponent) return { id: "producer" } as never;
    if (type === OwnerComponent) return { getOwner: () => 2 } as never;
    return undefined;
  });
  const origin = { schemaVersion: 1 as const, commandId: "purchase", commitmentKey: "purchase:producer",
    source: "ai" as const, authorityEpoch: 1, sequence: 4, intentId: "purchase-intent", effectId: "purchase-effect" };
  const cancellation = { type: "CANCEL_PRODUCTION", playerNumber: 2, actorIds: ["producer"], queueIndex: 0, tick: 102,
    execution: { ...origin, commandId: "cancel", commitmentKey: "cancel:producer", sequence: 5,
      intentId: "cancel-intent", effectId: "cancel-effect" } } satisfies GameCommand;
  return {
    phase: "finished", operationId: 1, requested: { food: 7 }, before: { food: 100, wood: 100, stone: 100, minerals: 100 },
    after: { food: 107, wood: 100, stone: 100, minerals: 100 }, status: "returned", callbackCount: 1,
    callbackLimitExceeded: false, nestedEmission: false, balanceMatches: true, snapshotRestoreInProgress: false,
    scope: { producer: {} as Phaser.GameObjects.GameObject, playerNumber: 2, operation: "cancellation_refund", amounts: { food: 7 },
      cancellationCommand: cancellation, item: { type: QueueItemType.Production, totalTime: 100, remainingTime: 40,
        commandContext: { execution: origin, playerNumber: 2, actorIds: ["producer"] },
        productionData: { actorName: ObjectNames.TivaraWorker,
          costData: { costType: PaymentType.PayOverTime, productionTime: 100, refundFactor: 0.5,
            resources: { [ResourceType.Food]: 35 } } } } }
  };
}

describe("projectAiRuntimeQueueResource", () => {
  it("keeps purchase/cancellation lineage and stored per-tick price separate from the scoped refund", () => {
    const input = event();
    const identify = jest.fn(() => "queue:producer:purchase");
    const result = projectAiRuntimeQueueResource(input, identify, 102);
    expect(identify).toHaveBeenCalledWith("producer", input.scope.item);
    expect(result).toMatchObject({ actorId: "producer", ownerNumber: 2, itemId: "queue:producer:purchase",
      storedPrice: { food: 35 }, refundFactor: 0.5, payment: "per_successful_tick", remainingTimeMs: 40,
      originatingCommandContext: { execution: { commandId: "purchase", sequence: 4 } },
      cancellationCommand: { execution: { commandId: "cancel", sequence: 5 } }, emission: { requested: { food: 7 } }, gaps: [] });
    input.scope.item.remainingTime = 0;
    expect(result.remainingTimeMs).toBe(40);
    expect(result).not.toHaveProperty("producer");
    expect(result.emission).not.toHaveProperty("scope");
  });

  it("retains denied tick attempts as detached affordability facts without inventing payment callbacks", () => {
    const original = event();
    const input = {
      scope: { ...original.scope, operation: "tick_charge", cancellationCommand: undefined },
      phase: "denied", reason: "insufficient_resources", operationId: 2,
      requested: { food: 35 }, before: { food: 10, wood: 100, stone: 100, minerals: 100 },
      snapshotRestoreInProgress: false
    } satisfies QueueResourceEmissionEvent;
    const result = projectAiRuntimeQueueResource(input, () => "item", 102);
    expect(result).toMatchObject({ operation: "tick_charge", remainingTimeMs: 40,
      originatingCommandContext: { execution: { commandId: "purchase" } }, cancellationCommand: null,
      emission: { phase: "denied", reason: "insufficient_resources", before: { food: 10 } }, gaps: [] });
    expect(result.emission).not.toHaveProperty("callbackCount");
    expect(result.emission).not.toHaveProperty("after");
    input.scope.item.remainingTime = 0;
    expect(result.remainingTimeMs).toBe(40);
  });

  it("reads research price/refund policy from the real definition", () => {
    const original = event();
    const researchType = ResearchType.TivaraMacemanUpgradeLevel2;
    const definition = researchDefinitions[researchType];
    const cancellation = { ...original.scope.cancellationCommand, type: "CANCEL_RESEARCH", playerNumber: 2,
      actorIds: ["producer"], tick: 102, queueIndex: 0 } satisfies GameCommand;
    const input = { ...original, scope: { ...original.scope, cancellationCommand: cancellation,
      item: { type: QueueItemType.Research, researchData: researchType,
        totalTime: definition.researchTime, remainingTime: definition.researchTime,
        commandContext: original.scope.item.commandContext } } } satisfies QueueResourceEmissionEvent;
    const result = projectAiRuntimeQueueResource(input, () => "research-item", 102);
    expect(result.storedPrice).toEqual(definition.cost);
    expect(result.refundFactor).toBe(definition.refundFactor);
    expect(result.payment).toBe("immediate");
    expect(result.objectName).toBeNull();
    expect(result.researchType).toBe(researchType);
    expect(result.gaps).toEqual([]);
  });

  it("flags absent or wrong cancellation provenance and real callback timing without granting refund evidence", () => {
    const input = event();
    expect(projectAiRuntimeQueueResource(input, () => "item", 100).gaps)
      .toContain("queue_resource_cancellation_before_scheduled_tick");
    const wrong = { ...input, scope: { ...input.scope,
      cancellationCommand: { ...input.scope.cancellationCommand, type: "CANCEL_RESEARCH", playerNumber: 1,
        actorIds: ["other"], tick: 102, queueIndex: 0 } satisfies GameCommand } } satisfies QueueResourceEmissionEvent;
    expect(projectAiRuntimeQueueResource(wrong, () => "item", 102).gaps)
      .toContain("queue_resource_cancellation_command_mismatch");
    const missing = { ...input, scope: { ...input.scope, cancellationCommand: undefined } };
    expect(projectAiRuntimeQueueResource(missing, () => "item", 102).gaps)
      .toContain("queue_resource_cancellation_command_missing");
    const originalContext = input.scope.item.commandContext;
    const actualCancellation = input.scope.cancellationCommand;
    if (!originalContext || !actualCancellation) throw new Error("synthetic command lineage missing");
    const reused = { ...input, scope: { ...input.scope, cancellationCommand: {
      ...actualCancellation, execution: originalContext.execution
    } } } satisfies QueueResourceEmissionEvent;
    expect(projectAiRuntimeQueueResource(reused, () => "item", 102).gaps)
      .toContain("queue_resource_cancellation_reuses_purchase_command");
  });

  it("retains legacy capture-local identity and explicit malformed progress/price/callback gaps", () => {
    const input = event();
    input.scope.item.commandContext = undefined;
    input.scope.item.productionData = undefined;
    input.scope.item.remainingTime = Infinity;
    const missing = { ...input, phase: "finished", status: "threw", callbackCount: 9, callbackLimitExceeded: true,
      balanceMatches: false, before: null, after: null } satisfies QueueResourceEmissionEvent;
    const result = projectAiRuntimeQueueResource(missing, () => "capture-item:producer:1", 102);
    expect(result.identitySource).toBe("capture_local");
    expect(result.remainingTimeMs).toBeNull();
    expect(result.gaps).toEqual(expect.arrayContaining(["queue_resource_originating_command_missing",
      "queue_resource_stored_price_missing", "queue_resource_progress_invalid", "queue_resource_scoped_sample_missing",
      "queue_resource_emission_threw", "queue_resource_callback_count_invalid", "queue_resource_callback_limit_exceeded",
      "queue_resource_scoped_balance_mismatch"]));
    jest.mocked(getActorComponent).mockReturnValue(undefined);
    const absentActor = projectAiRuntimeQueueResource(input, () => "unused", 102);
    expect(absentActor.itemId).toBeNull();
    expect(absentActor.gaps).toContain("queue_resource_actor_identity_missing");
    expect(absentActor.gaps).toContain("queue_resource_owner_mismatch");
  });

  it("flags wrong purchase ownership and cancellation attached to a charge", () => {
    const input = event();
    const commandContext = input.scope.item.commandContext;
    if (!commandContext) throw new Error("synthetic originating context missing");
    input.scope.item.commandContext = { ...commandContext, playerNumber: 1, actorIds: ["other"] };
    const charge = { ...input, scope: { ...input.scope, operation: "immediate_charge" } } satisfies QueueResourceEmissionEvent;
    expect(projectAiRuntimeQueueResource(charge, () => "item", 102).gaps).toEqual(expect.arrayContaining([
      "queue_resource_originating_command_mismatch", "queue_resource_unexpected_cancellation_command"
    ]));
    const nested = { ...input, phase: "finished", status: "returned", after: null, callbackCount: 1,
      callbackLimitExceeded: false, nestedEmission: true, balanceMatches: false } satisfies QueueResourceEmissionEvent;
    expect(projectAiRuntimeQueueResource(nested, () => "item", 102).gaps).toContain("queue_resource_nested_emission");
  });
});
