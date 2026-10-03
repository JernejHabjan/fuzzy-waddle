import Phaser from "phaser";
import { Subject } from "rxjs";
import {
  FactionType, ObjectNames, ProbableWaffleAiDifficulty, ProbableWafflePlayerType, ResearchType, ResourceType,
  type GameCommand, type GameCommandOutcome
} from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-profile-defaults";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { QueueItemType, type UnifiedQueueItem } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { emitResource, getCommunicator, getPlayer, isSnapshotApplyInProgress } from "../../../data/scene-data";
import { emitQueueItemResource } from "../../../data/emit-queue-item-resource";
import { QUEUE_RESOURCE_EMISSION_EVENT } from "../../../data/queue-resource-emission-event";
import { getSceneService, getSceneSystem } from "../../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { AiRuntimeProductionCapture } from "./ai-runtime-production-capture";
import { AI_DECISION_DISPATCH_EVENT, type AiDecisionDispatchEvent } from "../ai-decision-dispatch-event";
import { AI_INTENT_COMMAND_DISPATCH_EVENT } from "../ai-intent-command-dispatch-event";
import { pendingCommandRequest, pendingCommandOutcome, pendingCommandFinished } from "./ai-runtime-pending-command-fixtures";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({
  getPlayer: jest.fn(), getCommunicator: jest.fn(), emitResource: jest.fn(), isSnapshotApplyInProgress: jest.fn()
}));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn(), getSceneSystem: jest.fn() }));

function item(): UnifiedQueueItem {
  return { type: QueueItemType.Production, totalTime: 150, remainingTime: 100,
    productionData: { actorName: ObjectNames.TivaraWorker,
      costData: { costType: PaymentType.PayOverTime, productionTime: 150, refundFactor: 1, resources: { [ResourceType.Food]: 7 } } } };
}

function outcome(kind: GameCommandOutcome["kind"], commandId = "cancel-request"): GameCommandOutcome {
  return { schemaVersion: 1, kind, reason: "applied", tick: 0, playerNumber: 2, commandId,
    commitmentKey: "queue:producer", authorityEpoch: 1, sequence: 1, actorIds: ["producer"], worldLinkIds: [] };
}

function setup() {
  const outcomes = new Subject<GameCommandOutcome>();
  const commands = new Subject<GameCommand>();
  const changes = new Subject<{ property: "resource.added" | "resource.removed";
    data: { playerNumber: number; playerStateData: { resources: Partial<Record<ResourceType, number>> } } }>();
  const queueChanges = new Subject<never[]>();
  const unregistered = new Subject<Phaser.GameObjects.GameObject>();
  const researches = new Subject<{ playerNumber: number; researchType: ResearchType }>();
  const completedResearch = new Set<ResearchType>();
  const ticks = { currentTick: 0, tick$: new Subject<number>() };
  const money: Record<ResourceType, number> = { food: 100, wood: 100, stone: 100, minerals: 100 };
  const queuedItems = [item(), item()];
  const queue = { queueDefinition: { capacityPerQueue: 5 }, queues: [{ queuedItems }],
    get allItems() { return queuedItems; }, queueChangedObservable: queueChanges.asObservable() };
  const state = { ...createAiBrainStateV1({ playerNumber: 2, faction: FactionType.Tivara, tick: 0, archetypeId: "balanced",
    profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium) }) };
  const controller = { getBrainState: () => state, getCommittedObservation: () => undefined,
    getCommittedCapabilityCatalog: () => undefined,
    isDecisionBoundarySettled: jest.fn(() => true) };
  const scene = { players: [{ playerNumber: 2 }], communicator: { playerChanged: { on: changes } },
    events: new Phaser.Events.EventEmitter() } as unknown as ProbableWaffleScene;
  const actor = { scene, active: true, name: ObjectNames.AnkGuard } as Phaser.GameObjects.GameObject;
  jest.mocked(getPlayer).mockReturnValue({ getResources: () => money } as never);
  jest.mocked(getSceneSystem).mockReturnValue({ getAiPlayerController: () => controller } as never);
  jest.mocked(getSceneService).mockImplementation((_scene, service) => {
    if (service === SimulationTickService) return ticks as never;
    if (service === CommandBusService) return { command$: commands, commandOutcome$: outcomes } as never;
    if (service === ActorIndexSystem) return { getAllIdActors: () => [actor], getOwnedActors: () => [actor],
      actorRegistered: new Subject(), actorUnregistered: unregistered } as never;
    if (service === TechTreeService) return { researchCompleted: researches, getPlayerResearch: () => completedResearch } as never;
    return undefined;
  });
  jest.mocked(getActorComponent).mockImplementation((_actor, component) => {
    if (component === QueueComponent) return queue as never;
    if (component === IdComponent) return { id: "producer" } as never;
    if (component === OwnerComponent) return { getOwner: () => 2 } as never;
    return undefined;
  });
  return { capture: new AiRuntimeProductionCapture(scene), state, controller, scene, actor, queuedItems,
    ticks, money, changes, commands, outcomes, queueChanges, unregistered, researches, completedResearch };
}

describe("AiRuntimeProductionCapture", () => {
  it("captures a human shared-queue boundary without synthesizing a committed AI input or bypassing the AI gate", () => {
    const fixture = setup();
    fixture.ticks.currentTick = 8;
    jest.mocked(getSceneSystem).mockReturnValue(undefined);
    jest.mocked(getPlayer).mockReturnValue({ getResources: () => fixture.money,
      playerController: { data: { playerDefinition: { playerType: ProbableWafflePlayerType.Human } } } } as never);
    const snapshot = fixture.capture.captureHumanQueueBoundary(2).snapshots.at(-1);
    expect(snapshot).toMatchObject({ tick: 8, observation: null, capabilityCatalog: null, economyProduction: null });
    expect(snapshot?.queues[0].lanes[0].items).toHaveLength(2);
    expect(() => fixture.capture.capture(2)).toThrow("production_capture_boundary_unsettled");
    jest.mocked(getPlayer).mockReturnValue({ getResources: () => fixture.money,
      playerController: { data: { playerDefinition: { playerType: ProbableWafflePlayerType.AI } } } } as never);
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
    const purchased: UnifiedQueueItem = { type: QueueItemType.Production, totalTime: 100, remainingTime: 100,
      productionData: { actorName: ObjectNames.TivaraWorker,
        costData: { costType: PaymentType.PayImmediately, productionTime: 100, refundFactor: 0.5, resources: { food: 35 } } },
      commandContext: { execution: { schemaVersion: 1, commandId: "purchase", commitmentKey: "purchase:producer",
        source: "ai", authorityEpoch: 1, sequence: 4 }, playerNumber: 2, actorIds: ["producer"] } };
    fixture.money.food = 111;
    emitQueueItemResource({ producer: fixture.actor, item: purchased, operation: "immediate_charge",
      amounts: { food: 35 }, playerNumber: 2 });
    fixture.queuedItems.push(purchased);
    fixture.queueChanges.next([]);
    const initial = fixture.capture.capture(2);
    expect(initial.facts.map((fact) => fact.kind)).toEqual([
      "queue_resource", "resources_applied", "queue_resource", "queue_resource", "queue_changed"
    ]);
    const started = initial.facts[0];
    const generic = initial.facts[1];
    const finished = initial.facts[3];
    expect(started.kind === "queue_resource" && started.resource.itemId).toBe("queue:producer:purchase");
    expect(generic.kind === "resources_applied" && generic.balanceMatches).toBe(false);
    expect(finished.kind === "queue_resource" && finished.resource.emission).toMatchObject({ phase: "finished",
      before: { food: 111 }, after: { food: 76 }, balanceMatches: true, callbackCount: 1 });
    expect(started.boundaryState?.resources?.food).toBe(111);
    expect(finished.boundaryState?.resources?.food).toBe(76);
    expect(started.boundaryState?.queues?.[0].lanes[0].items).toHaveLength(2);
    expect(finished.boundaryState?.gaps).toContain("production_boundary_unspent_reconciliation_missing");
    expect(initial.snapshots[0].queues[0].lanes[0].items[2].itemId).toBe("queue:producer:purchase");
    fixture.queuedItems.pop();
    emitQueueItemResource({ producer: fixture.actor, item: purchased, operation: "cancellation_refund",
      amounts: { food: 7 }, playerNumber: 2, cancellationCommand: { type: "CANCEL_PRODUCTION", tick: 0,
        playerNumber: 2, actorIds: ["producer"], queueIndex: 0, execution: { schemaVersion: 1, commandId: "cancel",
          commitmentKey: "cancel:producer", source: "ai", authorityEpoch: 1, sequence: 5 } } });
    const refunded = fixture.capture.capture(2);
    const refund = refunded.facts[refunded.facts.length - 1];
    expect(refund.kind === "queue_resource" && refund.resource).toMatchObject({ itemId: "queue:producer:purchase",
      originatingCommandContext: { execution: { commandId: "purchase" } },
      cancellationCommand: { execution: { commandId: "cancel" } }, storedPrice: { food: 35 },
      emission: { requested: { food: 7 }, after: { food: 83 }, balanceMatches: true } });
    expect(refunded.gaps).toContain("queue_resource_runtime_authority_unverified");
    expect(initial.snapshots[0].resources.food).toBe(76);
    fixture.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
    expect(fixture.scene.events.listenerCount(QUEUE_RESOURCE_EMISSION_EVENT)).toBe(0);
    expect(fixture.changes.observed).toBe(false);
  });

  it("retains actual buffered request time, intended execution tick and unspent AI claims independently of queue liabilities", () => {
    const fixture = setup();
    fixture.ticks.currentTick = 100;
    fixture.scene.events.emit(AI_INTENT_COMMAND_DISPATCH_EVENT, pendingCommandRequest());
    fixture.outcomes.next(pendingCommandOutcome());
    fixture.scene.events.emit(AI_INTENT_COMMAND_DISPATCH_EVENT, pendingCommandFinished());
    const captured = fixture.capture.capture(2);
    expect(captured.facts.map((fact) => [fact.sequence, fact.tick, fact.kind])).toEqual([
      [1, 100, "intent_dispatch"], [2, 100, "outcome"], [3, 100, "intent_dispatch"]
    ]);
    const admitted = captured.facts[1];
    expect(admitted.kind === "outcome" && admitted.scheduledTick).toBe(102);
    expect(admitted.kind === "outcome" && admitted.outcome.tick).toBe(102);
    expect(admitted.kind === "outcome" && admitted.boundaryStateBefore?.pendingResourceClaims?.food).toBe(0);
    expect(admitted.boundaryState?.pendingResourceClaims?.food).toBe(35);
    expect(admitted.boundaryState?.obligations?.food).toBe(28);
    expect(captured.snapshots[0].pendingResourceClaims?.food).toBe(35);
    expect(captured.snapshots[0].resources.food).toBe(100);
    expect(captured.snapshots[0].obligations.food).toBe(28);
    fixture.ticks.currentTick = 102;
    fixture.outcomes.next(pendingCommandOutcome("applied"));
    const after = fixture.capture.capture(2);
    expect(after.snapshots[1].pendingCommands).toEqual([]);
    const applied = after.facts.at(-1);
    expect(applied?.kind === "outcome" && applied.boundaryStateBefore?.pendingResourceClaims?.food).toBe(35);
    expect(applied?.boundaryState?.pendingResourceClaims?.food).toBe(0);
    expect(after.snapshots[1].pendingResourceClaims?.food).toBe(0);
    expect(captured.snapshots[0].pendingResourceClaims?.food).toBe(35);
    expect(after.gaps).toContain("pending_dispatch_before_capture_or_restore");
    fixture.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
    expect(fixture.scene.events.listenerCount(AI_INTENT_COMMAND_DISPATCH_EVENT)).toBe(0);
    expect(fixture.outcomes.observed).toBe(false);
  });

  it("samples per-tick cash before the physical progress decrement instead of inventing post-payment obligations", () => {
    const f = setup();
    jest.mocked(getCommunicator).mockReturnValue(f.scene.communicator as never);
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
    jest.mocked(emitResource).mockImplementation((_scene, action, amounts) => {
      for (const type of Object.values(ResourceType)) f.money[type] +=
        (action === "resource.added" ? 1 : -1) * (amounts[type] ?? 0);
      f.changes.next({ property: action, data: { playerNumber: 2, playerStateData: { resources: amounts } } });
    });
    emitQueueItemResource({ producer: f.actor, item: f.queuedItems[0], operation: "tick_charge",
      amounts: { food: 7 }, playerNumber: 2 });
    f.queuedItems[0].remainingTime -= 50;
    f.queueChanges.next([]);
    const capture = f.capture.capture(2);
    const started = capture.facts[0];
    const finished = capture.facts[3];
    const changed = capture.facts[4];
    expect(started.boundaryState?.resources?.food).toBe(100);
    expect(finished.boundaryState?.resources?.food).toBe(93);
    expect(started.boundaryState?.obligations?.food).toBe(28);
    expect(finished.boundaryState?.obligations?.food).toBe(28);
    expect(changed.boundaryState?.obligations?.food).toBe(21);
    expect(finished.boundaryState?.queues?.[0].lanes[0].items[0].remainingTimeMs).toBe(100);
    expect(changed.boundaryState?.queues?.[0].lanes[0].items[0].remainingTimeMs).toBe(50);
    f.queuedItems[0].remainingTime = 1;
    expect(changed.boundaryState?.queues?.[0].lanes[0].items[0].remainingTimeMs).toBe(50);
    f.capture.dispose();
  });

  it("retains a selected result separately from saved leases and fails absent queue authority to null", () => {
    const f = setup();
    const decision = { identity: { playerNumber: 2, tick: 0, generation: 7, decisionSequence: 8, authorityEpoch: 1 },
      acceptedIntents: [], decisions: [], economyProduction: f.state.economyProduction,
      reservations: [{ claimId: "claim:selected", ownerPlanId: "plan:force", subjectKey: "resource:food:35",
        state: { kind: "provisional", expiresAt: { clock: "simulation", unit: "tick", dueTick: 20, persistence: "save" } },
        prerequisites: [], createdTick: 0 }]
    } satisfies AiDecisionDispatchEvent;
    f.scene.events.emit(AI_DECISION_DISPATCH_EVENT, decision);
    f.outcomes.next(outcome("dispatched"));
    f.queuedItems[0].remainingTime = Number.NaN;
    f.outcomes.next(outcome("active"));
    f.queuedItems[0].remainingTime = 100;
    const captured = f.capture.capture(2);
    const selected = captured.facts[0];
    expect(selected.kind === "decision_selected" && selected.decision).toEqual(decision);
    expect(selected.kind === "decision_selected" && selected.decision.reservations).not.toBe(decision.reservations);
    expect(captured.facts[1].boundaryState?.brain?.reservations).toEqual([]);
    expect(captured.facts[1].boundaryState?.brain?.decisionSequence).toBe(0);
    expect(captured.facts[2].boundaryState?.obligations).toBeNull();
    expect(captured.facts[2].boundaryState?.queues).toBeNull();
    expect(captured.facts[2].boundaryState?.gaps).toContain("production_boundary_queue_authority_invalid");
    f.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
    expect(f.scene.events.listenerCount(AI_DECISION_DISPATCH_EVENT)).toBe(0);
  });

  it("retains request, synchronous refund and terminal callback order without inventing item attribution", () => {
    const fixture = setup();
    fixture.capture.capture(2);
    fixture.outcomes.next(outcome("dispatched"));
    fixture.money.food += 7;
    fixture.changes.next({ property: "resource.added", data: { playerNumber: 2,
      playerStateData: { resources: { [ResourceType.Food]: 7 } } } });
    fixture.outcomes.next(outcome("cancelled"));
    fixture.commands.next({ type: "CANCEL_PRODUCTION", tick: 0, playerNumber: 2, actorIds: ["producer"], queueIndex: 0 });
    const capture = fixture.capture.capture(2);
    expect(capture.facts.map((fact) => [fact.sequence, fact.tick, fact.kind])).toEqual([
      [1, 0, "outcome"], [2, 0, "resources_applied"], [3, 0, "outcome"], [4, 0, "command_delivered"]
    ]);
    const cash = capture.facts.find((fact) => fact.kind === "resources_applied");
    expect(cash?.kind === "resources_applied" && cash.balanceMatches).toBe(true);
    expect(cash?.kind === "resources_applied" && cash.before.food).toBe(100);
    expect(cash?.kind === "resources_applied" && cash.after.food).toBe(107);
    expect(capture.gaps).toContain("resource_item_attribution");
    fixture.capture.dispose();
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
    expect(captured.snapshots[0].completedResearch).toEqual([researchType]);
    expect(captured.facts.map((fact) => fact.kind)).toEqual(["research_completed", "actor_unregistered"]);
    expect(captured.facts.every((fact) => fact.playerNumber === 2)).toBe(true);
    fixture.capture.dispose();
  });

  it("keeps surviving item identities when indices shift, with detached physical lane and obligation facts", () => {
    const fixture = setup();
    const initial = fixture.capture.capture(2).snapshots[0];
    expect(initial.ownedActors).toEqual([{ actorId: "producer", objectName: ObjectNames.AnkGuard }]);
    expect(initial.obligations.food).toBe(28);
    const survivor = initial.queues[0].lanes[0].items[1].itemId;
    fixture.queuedItems.shift();
    fixture.queueChanges.next([]);
    const result = fixture.capture.capture(2);
    expect(result.snapshots[1].queues[0].lanes[0].items[0].itemId).toBe(survivor);
    expect(result.snapshots[1].queues[0].lanes[0].capacity).toBe(5);
    expect(result.snapshots[1].queues[0].lanes).toHaveLength(1);
    expect(result.snapshots[1].obligations.food).toBe(14);
    fixture.queuedItems[0].remainingTime = 1;
    expect(result.snapshots[1].queues[0].lanes[0].items[0].remainingTimeMs).toBe(100);
    expect(result.facts.some((fact) => fact.kind === "queue_changed")).toBe(true);
    fixture.capture.dispose();
  });

  it("retains command-backed restore identity and the brain's terminal schedule without invoking a planner", () => {
    const fixture = setup();
    const context = { execution: { schemaVersion: 1 as const, commandId: "train", commitmentKey: "train:producer",
      authorityEpoch: 1, sequence: 1, source: "ai" as const }, playerNumber: 2, actorIds: ["producer"] };
    fixture.queuedItems[0].commandContext = context;
    const firstId = fixture.capture.capture(2).snapshots[0].queues[0].lanes[0].items[0].itemId;
    fixture.queuedItems[0] = { ...item(), commandContext: structuredClone(context) };
    fixture.state.economyProduction = { ...fixture.state.economyProduction, transition: {
      planId: "plan:production-transition:test", demandId: "demand:production-transition:test", targetActorId: "target",
      domain: "ground", producerObjectName: ObjectNames.AnkGuard, productObjectName: ObjectNames.TivaraWorker,
      committedTick: 1, beginsTick: 100, forceDeadlineTick: 200, desiredForce: 12, desiredProducers: 2,
      unitDurationTicks: 50, status: "expired", reason: "missed_deadline"
    } };
    const second = fixture.capture.capture(2).snapshots[1];
    expect(second.queues[0].lanes[0].items[0].itemId).toBe(firstId);
    expect(second.economyProduction?.transition?.status).toBe("expired");
    fixture.capture.dispose();
  });

  it("marks unobserved balance mutation and dropped records, rejecting unsettled and disposed boundaries", () => {
    const fixture = setup();
    fixture.money.food += 1;
    fixture.changes.next({ property: "resource.added", data: { playerNumber: 2, playerStateData: { resources: {} } } });
    const cash = fixture.capture.capture(2).facts[0];
    expect(cash.kind === "resources_applied" && cash.balanceMatches).toBe(false);
    for (let index = 0; index < 8193; index += 1) fixture.outcomes.next(outcome("dispatched", `request:${index}`));
    const bounded = fixture.capture.capture(2);
    expect(bounded.facts).toHaveLength(8192);
    expect(bounded.droppedFactCount).toBe(2);
    for (let index = 0; index < 256; index += 1) fixture.capture.capture(2);
    expect(fixture.capture.capture(2).droppedSnapshotCount).toBeGreaterThan(0);
    fixture.ticks.currentTick = 1;
    fixture.controller.isDecisionBoundarySettled.mockReturnValue(false);
    expect(() => fixture.capture.capture(2)).toThrow("production_capture_boundary_unsettled");
    fixture.capture.dispose();
    fixture.capture.dispose();
    expect(fixture.outcomes.observed).toBe(false);
    expect(fixture.queueChanges.observed).toBe(false);
    expect(() => fixture.capture.capture(2)).toThrow("production_capture_disposed");
  });
});
