import Phaser from "phaser";
import { Subject } from "rxjs";
import {
  ObjectNames,
  ResearchType,
  ResourceType,
  type GameCommand,
  type GameCommandExecution
} from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { researchDefinitions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/research/research-definitions";
import { getActorComponent } from "../../data/actor-component";
import { emitResource, getCommunicator, getPlayer, isSnapshotApplyInProgress } from "../../data/scene-data";
import {
  QUEUE_RESOURCE_EMISSION_EVENT,
  type QueueResourceEmissionEvent
} from "../../data/queue-resource-emission-event";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import { TechTreeService } from "../../data/tech-tree/tech-tree.service";
import { OwnerComponent } from "../components/owner-component";
import { ProductionComponent } from "../components/production/production-component";
import { ResearchComponent } from "../components/research/research-component";
import { QueueComponent } from "../components/queue/queue-component";
import { QueueCommandSystem } from "./queue-command.system";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../data/scene-data", () => ({
  emitResource: jest.fn(),
  getCommunicator: jest.fn(),
  getPlayer: jest.fn(),
  isSnapshotApplyInProgress: jest.fn()
}));
jest.mock("../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../data/game-object-helper", () => ({
  onObjectReady: (_actor: unknown, callback: () => void, context: unknown) => callback.call(context),
  isGameObjectActiveInActiveScene: () => true
}));
jest.mock("../../prefabs/buildings/misc/RallyPoint", () => ({
  __esModule: true,
  default: jest.fn(() => ({ init: jest.fn(), reset: jest.fn(), destroy: jest.fn() }))
}));
jest.mock("../../prefabs/definitions/actor-definitions", () => ({
  getPwActorDefinition: () => ({
    components: {
      productionCost: {
        costType: PaymentType.PayImmediately,
        productionTime: 150,
        refundFactor: 0.5,
        resources: { food: 40 }
      },
      info: { smallImage: { key: "units", frame: "worker" } }
    }
  })
}));

function execution(commandId: string, sequence: number): GameCommandExecution {
  return { schemaVersion: 1, commandId, commitmentKey: commandId, source: "ai", authorityEpoch: 1, sequence };
}

/** Real command system/components, synthetic scene and cash authority; this is not socket or runtime evidence. */
function setup(observe = true) {
  jest.clearAllMocks();
  const commands = new Subject<GameCommand>();
  const tick$ = new Subject<number>();
  const ticks = { tick$, currentTick: 0 };
  const changes = new Subject<{
    property: "resource.added" | "resource.removed";
    data: { playerNumber: number; playerStateData: { resources: Partial<Record<ResourceType, number>> } };
  }>();
  const money: Record<ResourceType, number> = { food: 100, wood: 100, stone: 100, minerals: 100 };
  const scene = { events: new Phaser.Events.EventEmitter(), sys: { isActive: () => true } } as unknown as Phaser.Scene;
  const actor = Object.assign(new Phaser.Events.EventEmitter(), {
    scene,
    name: ObjectNames.AnkGuard,
    active: true
  }) as unknown as Phaser.GameObjects.GameObject;
  const reportOutcome = jest.fn();
  const reportPersistedOutcome = jest.fn();
  const techTree = { isContentAllowed: () => true, isResearched: () => false };
  jest.mocked(getSceneService).mockImplementation((_scene, service) => {
    if (service === CommandBusService) return { command$: commands, reportOutcome, reportPersistedOutcome } as never;
    if (service === SimulationTickService) return ticks as never;
    if (service === TechTreeService) return techTree as never;
    return undefined;
  });
  const queue = new QueueComponent(actor, { queueCount: 1, capacityPerQueue: 5 });
  let production: ProductionComponent | undefined;
  let research: ResearchComponent | undefined;
  jest.mocked(getActorComponent).mockImplementation((_actor, component) => {
    if (component === QueueComponent) return queue as never;
    if (component === ProductionComponent) return production as never;
    if (component === ResearchComponent) return research as never;
    if (component === OwnerComponent) return { getOwner: () => 2 } as never;
    if (component === IdComponent) return { id: "producer" } as never;
    return undefined;
  });
  production = new ProductionComponent(actor, { availableProduceActors: [ObjectNames.TivaraWorker] });
  research = new ResearchComponent(actor, { availableResearch: [ResearchType.SnowstormSpell] });
  new QueueCommandSystem(actor);
  let restoring = false;
  jest.mocked(getPlayer).mockReturnValue({
    getResources: () => money,
    canPayAllResources: (price: Partial<Record<ResourceType, number>>) =>
      Object.values(ResourceType).every((type) => money[type] >= (price[type] ?? 0))
  } as never);
  jest.mocked(getCommunicator).mockReturnValue({ playerChanged: { on: changes } } as never);
  jest.mocked(isSnapshotApplyInProgress).mockImplementation(() => restoring);
  jest.mocked(emitResource).mockImplementation((_scene, action, amounts, playerNumber) => {
    if (restoring) return;
    for (const type of Object.values(ResourceType))
      money[type] += (action === "resource.added" ? 1 : -1) * (amounts[type] ?? 0);
    changes.next({
      property: action,
      data: { playerNumber: playerNumber ?? 2, playerStateData: { resources: amounts } }
    });
  });
  const observations: { event: QueueResourceEmissionEvent; queued: boolean; remainingTime: number }[] = [];
  if (observe)
    scene.events.on(QUEUE_RESOURCE_EMISSION_EVENT, (event: QueueResourceEmissionEvent) => {
      observations.push({
        event,
        queued: queue.allItems.includes(event.scope.item),
        remainingTime: event.scope.item.remainingTime
      });
    });
  return {
    actor,
    scene,
    queue,
    production,
    research,
    commands,
    tick$,
    changes,
    money,
    observations,
    reportOutcome,
    reportPersistedOutcome,
    ticks,
    step: (tick: number) => {
      ticks.currentTick = tick;
      tick$.next(tick);
    },
    restore: () => {
      restoring = true;
    }
  };
}

function purchase(): GameCommand {
  return {
    type: "PRODUCTION",
    tick: 0,
    playerNumber: 2,
    actorIds: ["producer"],
    actorName: ObjectNames.TivaraWorker,
    execution: execution("purchase", 1)
  };
}

function cancel() {
  return {
    type: "CANCEL_PRODUCTION",
    tick: 2,
    playerNumber: 2,
    actorIds: ["producer"],
    queueIndex: 0,
    execution: execution("cancel", 2)
  } satisfies GameCommand;
}

describe("shared queue resource callers", () => {
  it("charges the exact pre-insertion item and refunds the removed item with separate stamped cancellation lineage", () => {
    const fixture = setup();
    fixture.commands.next(purchase());
    const item = fixture.queue.allItems[0];
    expect(fixture.money.food).toBe(60);
    expect(fixture.observations.slice(0, 3).every(({ event, queued }) => event.scope.item === item && !queued)).toBe(
      true
    );
    expect(item.commandContext?.execution.commandId).toBe("purchase");
    fixture.ticks.currentTick = 2;
    const cancellation = cancel();
    fixture.commands.next(cancellation);
    const refunds = fixture.observations.slice(3);
    expect(refunds).toHaveLength(3);
    expect(
      refunds.every(
        ({ event, queued }) => event.scope.item === item && !queued && event.scope.cancellationCommand === cancellation
      )
    ).toBe(true);
    expect(refunds[2].event).toMatchObject({
      phase: "finished",
      requested: { food: 20 },
      before: { food: 60 },
      after: { food: 80 },
      balanceMatches: true
    });
    expect(fixture.reportPersistedOutcome).toHaveBeenCalledWith(
      expect.objectContaining({ commandId: "purchase", kind: "cancelled" })
    );
    expect(fixture.reportOutcome).toHaveBeenCalledWith(cancellation, "cancelled", "cancelled");
    expect(fixture.queue.allItems).toEqual([]);
    fixture.actor.emit(Phaser.GameObjects.Events.DESTROY);
    expect(fixture.commands.observed).toBe(false);
    expect(fixture.tick$.observed).toBe(false);
    expect(fixture.changes.observed).toBe(false);
  });

  it("charges the full stored vector each successful tick, denies without progress and preserves the progress-based refund", () => {
    const fixture = setup();
    fixture.production.startProduction({
      actorName: ObjectNames.TivaraWorker,
      costData: { costType: PaymentType.PayOverTime, productionTime: 150, refundFactor: 1, resources: { food: 40 } }
    });
    const item = fixture.queue.allItems[0];
    expect(fixture.money.food).toBe(100);
    fixture.step(1);
    fixture.step(2);
    expect(fixture.money.food).toBe(20);
    expect(item.remainingTime).toBe(50);
    fixture.step(3);
    expect(item.remainingTime).toBe(50);
    expect(fixture.money.food).toBe(20);
    expect(emitResource).toHaveBeenCalledTimes(2);
    expect(fixture.observations[6]).toMatchObject({
      remainingTime: 50,
      event: { phase: "denied", reason: "insufficient_resources", requested: { food: 40 }, before: { food: 20 } }
    });
    if (!item.productionData) throw new Error("production item missing");
    const cancellation = {
      type: "CANCEL_PRODUCTION",
      tick: 3,
      playerNumber: 2,
      actorIds: ["producer"],
      queueIndex: 0,
      execution: execution("cancel", 2)
    } satisfies GameCommand;
    fixture.queue.cancelProductionItem(item.productionData, cancellation);
    // Existing formula refunds one stored vector's remaining progress, not the 80 already paid.
    expect(fixture.money.food).toBe(33);
    expect(fixture.observations[9].event).toMatchObject({
      phase: "finished",
      requested: { food: 13 },
      balanceMatches: true
    });
    fixture.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });

  it("uses definition-priced research, retaining the item until the refund and forwarding its actual cancellation", () => {
    const fixture = setup();
    const definition = researchDefinitions[ResearchType.SnowstormSpell];
    fixture.commands.next({
      type: "RESEARCH",
      tick: 0,
      playerNumber: 2,
      actorIds: ["producer"],
      researchType: ResearchType.SnowstormSpell,
      execution: execution("research", 1)
    });
    const item = fixture.queue.allItems[0];
    expect(fixture.observations[0].queued).toBe(false);
    expect(fixture.observations[0].event.scope.amounts).toBe(definition.cost);
    item.remainingTime = item.totalTime / 2;
    fixture.ticks.currentTick = 2;
    const cancellation = {
      type: "CANCEL_RESEARCH",
      tick: 2,
      playerNumber: 2,
      actorIds: ["producer"],
      execution: execution("cancel-research", 2)
    } satisfies GameCommand;
    fixture.commands.next(cancellation);
    const refunds = fixture.observations.slice(3);
    expect(
      refunds.every(
        ({ event, queued }) => event.scope.item === item && queued && event.scope.cancellationCommand === cancellation
      )
    ).toBe(true);
    expect(refunds[2].event).toMatchObject({
      phase: "finished",
      requested: { minerals: 25, wood: 12 },
      balanceMatches: true
    });
    expect(item.commandContext?.execution.commandId).toBe("research");
    expect(fixture.queue.allItems).toEqual([]);
    fixture.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });

  it("rejects an unaffordable immediate purchase without payment, item insertion or payment diagnostics", () => {
    const fixture = setup();
    fixture.money.food = 0;
    fixture.commands.next(purchase());
    expect(emitResource).not.toHaveBeenCalled();
    expect(fixture.observations).toEqual([]);
    expect(fixture.queue.allItems).toEqual([]);
    expect(fixture.reportOutcome).toHaveBeenCalledWith(
      expect.objectContaining({ type: "PRODUCTION" }),
      "rejected",
      "insufficient_resources",
      ["producer"],
      [],
      expect.any(String)
    );
    fixture.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });

  it("retains restore suppression as absent callbacks without inventing credit", () => {
    const fixture = setup();
    fixture.commands.next(purchase());
    fixture.restore();
    fixture.ticks.currentTick = 2;
    fixture.commands.next(cancel());
    expect(fixture.money.food).toBe(60);
    expect(fixture.observations[4].event).toMatchObject({
      phase: "finished",
      snapshotRestoreInProgress: true,
      callbackCount: 0,
      after: { food: 60 },
      balanceMatches: false
    });
    fixture.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });

  it("forwards ordinary payments once and leaves unaffordable ticks silent without capture", () => {
    const fixture = setup(false);
    fixture.production.startProduction({
      actorName: ObjectNames.TivaraWorker,
      costData: { costType: PaymentType.PayOverTime, productionTime: 150, refundFactor: 1, resources: { food: 40 } }
    });
    fixture.step(1);
    fixture.money.food = 0;
    fixture.step(2);
    expect(emitResource).toHaveBeenCalledTimes(1);
    expect(getCommunicator).not.toHaveBeenCalled();
    expect(isSnapshotApplyInProgress).not.toHaveBeenCalled();
    expect(fixture.queue.allItems[0].remainingTime).toBe(100);
    fixture.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });
});
