import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import {
  QueueItemType,
  type UnifiedQueueItem
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import {
  ObjectNames,
  ProbableWafflePlayerType,
  ResearchType,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import Phaser from "phaser";
import { emitQueueItemResource } from "../../../data/emit-queue-item-resource";
import { QUEUE_RESOURCE_EMISSION_EVENT } from "../../../data/queue-resource-emission-event";
import { emitResource, getCommunicator, getPlayer, isSnapshotApplyInProgress } from "../../../data/scene-data";
import { PRODUCTION_SPATIAL_AUTHORITY_EVENT } from "../../../world/services/multiplayer/production-spatial-authority-event";
import { getSceneSystem } from "../../../world/services/scene-component-helpers";
import {
  productionCaptureItem as item,
  productionCaptureFixture as setup
} from "./ai-runtime-production-capture-fixtures";
jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({
  getPlayer: jest.fn(),
  getCommunicator: jest.fn(),
  emitResource: jest.fn(),
  isSnapshotApplyInProgress: jest.fn()
}));
jest.mock("../../../world/services/scene-component-helpers", () => ({
  getSceneService: jest.fn(),
  getSceneSystem: jest.fn()
}));
describe("AiRuntimeProductionCapture queue lifecycle", () => {
  it("detaches native spatial callbacks into the same observer ledger and removes their listener on teardown", () => {
    const f = setup();
    const queued = { ...item(), remainingTime: 0 };
    f.scene.events.emit(PRODUCTION_SPATIAL_AUTHORITY_EVENT, {
      kind: "spawn",
      producer: f.actor,
      item: queued,
      waterUnit: false,
      tile: { x: 4, y: 5 },
      position: { x: 100, y: 200, z: 0 }
    });
    const captured = f.capture.capture(2);
    const fact = requireAiTestEntry(captured.facts, 0);
    expect(fact).toMatchObject({
      kind: "spatial_authority",
      spatial: { kind: "spawn", producer: { actorId: "producer" }, item: { remainingTimeMs: 0 }, tile: { x: 4, y: 5 } }
    });
    queued.remainingTime = 99;
    expect(
      fact?.kind === "spatial_authority" && fact.spatial.kind === "spawn" && fact.spatial.item.remainingTimeMs
    ).toBe(0);
    f.capture.dispose();
    expect(f.scene.events.listenerCount(PRODUCTION_SPATIAL_AUTHORITY_EVENT)).toBe(0);
  });

  it("captures a human shared-queue boundary without synthesizing a committed AI input or bypassing the AI gate", () => {
    const fixture = setup();
    fixture.ticks.currentTick = 8;
    jest.mocked(getSceneSystem).mockReturnValue(undefined);
    jest.mocked(getPlayer).mockReturnValue({
      getResources: () => fixture.money,
      playerController: { data: { playerDefinition: { playerType: ProbableWafflePlayerType.Human } } }
    } as never);
    const snapshot = fixture.capture.captureHumanQueueBoundary(2).snapshots.at(-1);
    expect(snapshot).toMatchObject({ tick: 8, observation: null, capabilityCatalog: null, economyProduction: null });
    expect(requireAiTestEntry(requireAiTestEntry(snapshot?.queues, 0).lanes, 0).items).toHaveLength(2);
    expect(() => fixture.capture.capture(2)).toThrow("production_capture_boundary_unsettled");
    jest.mocked(getPlayer).mockReturnValue({
      getResources: () => fixture.money,
      playerController: { data: { playerDefinition: { playerType: ProbableWafflePlayerType.AI } } }
    } as never);
    expect(() => fixture.capture.captureHumanQueueBoundary(2)).toThrow("production_capture_human_boundary_required");
    fixture.capture.dispose();
  });

  it("captures exact item handles before insertion/after removal, preserving scoped cash and both command lineages", () => {
    const fixture = setup();
    jest.mocked(getCommunicator).mockReturnValue(fixture.scene.communicator as never);
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
    jest.mocked(emitResource).mockImplementation((_scene, action, amounts) => {
      for (const type of Object.values(ResourceType)) {
        fixture.money[type] += (action === "resource.added" ? 1 : -1) * (amounts[type] ?? 0);
      }
      fixture.changes.next({ property: action, data: { playerNumber: 2, playerStateData: { resources: amounts } } });
    });
    const purchased: UnifiedQueueItem = {
      type: QueueItemType.Production,
      totalTime: 100,
      remainingTime: 100,
      productionData: {
        actorName: ObjectNames.TivaraWorker,
        costData: {
          costType: PaymentType.PayImmediately,
          productionTime: 100,
          refundFactor: 0.5,
          resources: { food: 35 }
        }
      },
      commandContext: {
        execution: {
          schemaVersion: 1,
          commandId: "purchase",
          commitmentKey: "purchase:producer",
          source: "ai",
          authorityEpoch: 1,
          sequence: 4
        },
        playerNumber: 2,
        actorIds: ["producer"]
      }
    };
    fixture.money.food = 111;
    emitQueueItemResource({
      producer: fixture.actor,
      item: purchased,
      operation: "immediate_charge",
      amounts: { food: 35 },
      playerNumber: 2
    });
    fixture.queuedItems.push(purchased);
    fixture.queueChanges.next([]);
    const initial = fixture.capture.capture(2);
    expect(initial.facts.map((fact) => fact.kind)).toEqual([
      "queue_resource",
      "resources_applied",
      "queue_resource",
      "queue_resource",
      "queue_changed"
    ]);
    const started = requireAiTestEntry(initial.facts, 0);
    const generic = requireAiTestEntry(initial.facts, 1);
    const finished = requireAiTestEntry(initial.facts, 3);
    expect(started.kind === "queue_resource" && started.resource.itemId).toBe("queue:producer:purchase");
    expect(generic.kind === "resources_applied" && generic.balanceMatches).toBe(false);
    expect(finished.kind === "queue_resource" && finished.resource.emission).toMatchObject({
      phase: "finished",
      before: { food: 111 },
      after: { food: 76 },
      balanceMatches: true,
      callbackCount: 1
    });
    expect(started.boundaryState?.resources?.food).toBe(111);
    expect(finished.boundaryState?.resources?.food).toBe(76);
    expect(requireAiTestEntry(requireAiTestEntry(started.boundaryState?.queues, 0).lanes, 0).items).toHaveLength(2);
    expect(finished.boundaryState?.gaps).toContain("production_boundary_unspent_reconciliation_missing");
    expect(
      requireAiTestEntry(
        requireAiTestEntry(requireAiTestEntry(requireAiTestEntry(initial.snapshots, 0).queues, 0).lanes, 0).items,
        2
      ).itemId
    ).toBe("queue:producer:purchase");
    fixture.queuedItems.pop();
    emitQueueItemResource({
      producer: fixture.actor,
      item: purchased,
      operation: "cancellation_refund",
      amounts: { food: 7 },
      playerNumber: 2,
      cancellationCommand: {
        type: "CANCEL_PRODUCTION",
        tick: 0,
        playerNumber: 2,
        actorIds: ["producer"],
        queueIndex: 0,
        execution: {
          schemaVersion: 1,
          commandId: "cancel",
          commitmentKey: "cancel:producer",
          source: "ai",
          authorityEpoch: 1,
          sequence: 5
        }
      }
    });
    const refunded = fixture.capture.capture(2);
    const refund = requireAiTestEntry(refunded.facts, refunded.facts.length - 1);
    expect(refund.kind === "queue_resource" && refund.resource).toMatchObject({
      itemId: "queue:producer:purchase",
      originatingCommandContext: { execution: { commandId: "purchase" } },
      cancellationCommand: { execution: { commandId: "cancel" } },
      storedPrice: { food: 35 },
      emission: { requested: { food: 7 }, after: { food: 83 }, balanceMatches: true }
    });
    expect(refunded.gaps).toContain("queue_resource_runtime_authority_unverified");
    expect(requireAiTestEntry(initial.snapshots, 0).resources.food).toBe(76);
    fixture.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
    expect(fixture.scene.events.listenerCount(QUEUE_RESOURCE_EMISSION_EVENT)).toBe(0);
    expect(fixture.changes.observed).toBe(false);
  });

  it("uses tech authority and removes unregistered queue listeners, retaining selected-player facts only", () => {
    const fixture = setup();
    const researchType = ResearchType.TivaraMacemanUpgradeLevel2;
    fixture.completedResearch.add(researchType);
    fixture.researches.next({ playerNumber: 2, researchType });
    fixture.researches.next({ playerNumber: 1, researchType });
    fixture.unregistered.next(fixture.actor);
    expect(fixture.queueChanges.observed).toBe(false);
    const captured = fixture.capture.capture(2);
    expect(requireAiTestEntry(captured.snapshots, 0).completedResearch).toEqual([researchType]);
    expect(captured.facts.map((fact) => fact.kind)).toEqual(["research_completed", "actor_unregistered"]);
    expect(captured.facts.every((fact) => fact.playerNumber === 2)).toBe(true);
    expect(captured.snapshots.at(-1)?.afterSequence).toBe(captured.facts.at(-1)?.sequence);
    fixture.capture.dispose();
  });

  it("keeps surviving item identities when indices shift, with detached physical lane and obligation facts", () => {
    const fixture = setup();
    const initial = requireAiTestEntry(fixture.capture.capture(2).snapshots, 0);
    expect(initial.ownedActors).toEqual([{ actorId: "producer", objectName: ObjectNames.AnkGuard }]);
    expect(initial.obligations.food).toBe(28);
    const survivor = requireAiTestEntry(
      requireAiTestEntry(requireAiTestEntry(initial.queues, 0).lanes, 0).items,
      1
    ).itemId;
    fixture.queuedItems.shift();
    fixture.queueChanges.next([]);
    const result = fixture.capture.capture(2);
    expect(
      requireAiTestEntry(
        requireAiTestEntry(requireAiTestEntry(requireAiTestEntry(result.snapshots, 1).queues, 0).lanes, 0).items,
        0
      ).itemId
    ).toBe(survivor);
    expect(
      requireAiTestEntry(requireAiTestEntry(requireAiTestEntry(result.snapshots, 1).queues, 0).lanes, 0).capacity
    ).toBe(5);
    expect(requireAiTestEntry(requireAiTestEntry(result.snapshots, 1).queues, 0).lanes).toHaveLength(1);
    expect(requireAiTestEntry(result.snapshots, 1).obligations.food).toBe(14);
    requireAiTestEntry(fixture.queuedItems, 0).remainingTime = 1;
    expect(
      requireAiTestEntry(
        requireAiTestEntry(requireAiTestEntry(requireAiTestEntry(result.snapshots, 1).queues, 0).lanes, 0).items,
        0
      ).remainingTimeMs
    ).toBe(100);
    expect(result.facts.some((fact) => fact.kind === "queue_changed")).toBe(true);
    fixture.capture.dispose();
  });

  it("retains command-backed restore identity and the brain's terminal schedule without invoking a planner", () => {
    const fixture = setup();
    const context = {
      execution: {
        schemaVersion: 1 as const,
        commandId: "train",
        commitmentKey: "train:producer",
        authorityEpoch: 1,
        sequence: 1,
        source: "ai" as const
      },
      playerNumber: 2,
      actorIds: ["producer"]
    };
    requireAiTestEntry(fixture.queuedItems, 0).commandContext = context;
    const firstId = requireAiTestEntry(
      requireAiTestEntry(
        requireAiTestEntry(requireAiTestEntry(fixture.capture.capture(2).snapshots, 0).queues, 0).lanes,
        0
      ).items,
      0
    ).itemId;
    fixture.queuedItems[0] = { ...item(), commandContext: structuredClone(context) };
    fixture.state.economyProduction = {
      ...fixture.state.economyProduction,
      transition: {
        planId: "plan:production-transition:test",
        demandId: "demand:production-transition:test",
        targetActorId: "target",
        domain: "ground",
        producerObjectName: ObjectNames.AnkGuard,
        productObjectName: ObjectNames.TivaraWorker,
        committedTick: 1,
        beginsTick: 100,
        forceDeadlineTick: 200,
        desiredForce: 12,
        desiredProducers: 2,
        unitDurationTicks: 50,
        status: "expired",
        reason: "missed_deadline"
      }
    };
    const second = requireAiTestEntry(fixture.capture.capture(2).snapshots, 1);
    expect(requireAiTestEntry(requireAiTestEntry(requireAiTestEntry(second.queues, 0).lanes, 0).items, 0).itemId).toBe(
      firstId
    );
    expect(second.economyProduction?.transition?.status).toBe("expired");
    fixture.capture.dispose();
  });
});
