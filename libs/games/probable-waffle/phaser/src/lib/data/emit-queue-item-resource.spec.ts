import Phaser from "phaser";
import { Subject } from "rxjs";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { QueueItemType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { emitResource, getCommunicator, getPlayer, isSnapshotApplyInProgress } from "./scene-data";
import { emitQueueItemResource } from "./emit-queue-item-resource";
import { QUEUE_RESOURCE_EMISSION_EVENT, type QueueResourceEmissionEvent } from "./queue-resource-emission-event";
import type { QueueResourceEmissionRecord } from "./queue-resource-emission-record";
import type { QueueResourceEmissionScope } from "./queue-resource-emission-scope";

jest.mock("./scene-data", () => ({
  emitResource: jest.fn(), getCommunicator: jest.fn(), getPlayer: jest.fn(), isSnapshotApplyInProgress: jest.fn()
}));

/** Synthetic synchronous emitter inputs exercise observer mechanics, never shared runtime or refund legality. */
function setup(observe = true) {
  jest.clearAllMocks();
  const changes = new Subject<{ property: "resource.added" | "resource.removed";
    data: { playerNumber: number; playerStateData: { resources: Partial<Record<ResourceType, number>> } } }>();
  const scene = { events: new Phaser.Events.EventEmitter() } as unknown as Phaser.Scene;
  const money: Record<ResourceType, number> = { food: 100, wood: 100, stone: 100, minerals: 100 };
  let restoring = false;
  jest.mocked(getCommunicator).mockReturnValue({ playerChanged: { on: changes } } as never);
  jest.mocked(getPlayer).mockReturnValue({ getResources: () => money } as never);
  jest.mocked(isSnapshotApplyInProgress).mockImplementation(() => restoring);
  const scope = {
    producer: { scene } as Phaser.GameObjects.GameObject, playerNumber: 2, operation: "immediate_charge",
    amounts: { [ResourceType.Food]: 35 },
    item: { type: QueueItemType.Production, totalTime: 100, remainingTime: 100,
      productionData: { actorName: ObjectNames.TivaraWorker,
        costData: { costType: PaymentType.PayImmediately, productionTime: 100, refundFactor: 0.5,
          resources: { [ResourceType.Food]: 35 } } } }
  } satisfies QueueResourceEmissionScope;
  jest.mocked(emitResource).mockImplementation((_scene, action, amounts, playerNumber) => {
    if (restoring) return;
    for (const type of Object.values(ResourceType)) money[type] += (action === "resource.added" ? 1 : -1) * (amounts[type] ?? 0);
    if (playerNumber !== undefined) changes.next({ property: action,
      data: { playerNumber, playerStateData: { resources: amounts } } });
  });
  const records: QueueResourceEmissionRecord[] = [];
  if (observe) scene.events.on(QUEUE_RESOURCE_EMISSION_EVENT, ({ scope: live, ...record }: QueueResourceEmissionEvent) => {
    expect(live.item).toBe(scope.item);
    records.push(structuredClone(record));
  });
  return { scope, scene, money, changes, records, restore: () => { restoring = true; } };
}

describe("emitQueueItemResource", () => {
  it("forwards the original arguments exactly once without diagnostic work in ordinary scenes", () => {
    const fixture = setup(false);
    emitQueueItemResource(fixture.scope);
    expect(emitResource).toHaveBeenCalledWith(fixture.scene, "resource.removed", fixture.scope.amounts, 2);
    expect(emitResource).toHaveBeenCalledTimes(1);
    expect(getPlayer).not.toHaveBeenCalled();
    expect(getCommunicator).not.toHaveBeenCalled();
    expect(isSnapshotApplyInProgress).not.toHaveBeenCalled();
  });

  it("samples scoped cash around the exact callback, preserving detached request price and scene-local order", () => {
    const fixture = setup();
    fixture.money.food = 91;
    emitQueueItemResource(fixture.scope);
    expect(fixture.records.map((record) => record.phase)).toEqual(["started", "callback", "finished"]);
    expect(fixture.records.map((record) => record.operationId)).toEqual([1, 1, 1]);
    expect(fixture.records[0].before?.food).toBe(91);
    expect(fixture.records[2]).toMatchObject({ phase: "finished", after: { food: 56 },
      callbackCount: 1, callbackLimitExceeded: false, balanceMatches: true, status: "returned" });
    fixture.scope.amounts.food = 1;
    expect(fixture.records[0].requested?.food).toBe(35);
    expect(fixture.changes.observed).toBe(false);
    emitQueueItemResource(fixture.scope);
    expect(fixture.records[3].operationId).toBe(2);
  });

  it("uses the supplied refund vector without recomputing price or granting credit for a suppressed emission", () => {
    const fixture = setup();
    fixture.restore();
    emitQueueItemResource({ ...fixture.scope, operation: "cancellation_refund", amounts: { [ResourceType.Food]: 7 } });
    expect(emitResource).toHaveBeenCalledWith(fixture.scene, "resource.added", { food: 7 }, 2);
    expect(fixture.money.food).toBe(100);
    expect(fixture.records[1]).toMatchObject({ phase: "finished", snapshotRestoreInProgress: true,
      callbackCount: 0, before: { food: 100 }, after: { food: 100 }, balanceMatches: false });
    expect(fixture.changes.observed).toBe(false);
  });

  it("does not match equal-price copies, other players or the wrong action", () => {
    const fixture = setup();
    jest.mocked(emitResource).mockImplementation(() => {
      fixture.changes.next({ property: "resource.removed", data: { playerNumber: 2,
        playerStateData: { resources: { ...fixture.scope.amounts } } } });
      fixture.changes.next({ property: "resource.removed", data: { playerNumber: 1,
        playerStateData: { resources: fixture.scope.amounts } } });
      fixture.changes.next({ property: "resource.added", data: { playerNumber: 2,
        playerStateData: { resources: fixture.scope.amounts } } });
    });
    emitQueueItemResource(fixture.scope);
    expect(fixture.records.map((record) => record.phase)).toEqual(["started", "finished"]);
    expect(fixture.records[1]).toMatchObject({ callbackCount: 0, balanceMatches: false });
  });

  it("marks an absent player/channel explicitly and preserves the original no-callback emission", () => {
    const fixture = setup();
    jest.mocked(getPlayer).mockReturnValue(undefined);
    jest.mocked(getCommunicator).mockReturnValue({} as never);
    jest.mocked(emitResource).mockImplementation(() => undefined);
    emitQueueItemResource(fixture.scope);
    expect(emitResource).toHaveBeenCalledTimes(1);
    expect(fixture.records[1]).toMatchObject({ phase: "finished", before: null, after: null,
      callbackCount: 0, balanceMatches: false });
    expect(fixture.changes.observed).toBe(false);
  });

  it("does not equate a mutated callback vector with the original scoped request", () => {
    const fixture = setup();
    jest.mocked(emitResource).mockImplementation(() => {
      fixture.scope.amounts.food = 34;
      fixture.money.food -= 34;
      fixture.changes.next({ property: "resource.removed", data: {
        playerNumber: 2, playerStateData: { resources: fixture.scope.amounts }
      } });
    });
    emitQueueItemResource(fixture.scope);
    expect(fixture.records[1]).toMatchObject({ phase: "callback", requested: { food: 35 }, amounts: { food: 34 } });
    expect(fixture.records[2]).toMatchObject({ callbackCount: 1, balanceMatches: false });
  });

  it("rejects duplicate attribution and bounds repeated exact callbacks", () => {
    const fixture = setup();
    jest.mocked(emitResource).mockImplementation(() => {
      for (let index = 0; index < 20; index += 1) fixture.changes.next({ property: "resource.removed", data: {
        playerNumber: 2, playerStateData: { resources: fixture.scope.amounts }
      } });
      fixture.money.food -= 35;
    });
    emitQueueItemResource(fixture.scope);
    expect(fixture.records).toHaveLength(10);
    expect(fixture.records[9]).toMatchObject({ phase: "finished", callbackCount: 9,
      callbackLimitExceeded: true, balanceMatches: false });
    expect(fixture.changes.observed).toBe(false);
  });

  it("keeps emission exceptions and releases its temporary subscription", () => {
    const fixture = setup();
    const failure = new Error("shared emitter failure");
    jest.mocked(emitResource).mockImplementation(() => { throw failure; });
    expect(() => emitQueueItemResource(fixture.scope)).toThrow(failure);
    expect(fixture.records[1]).toMatchObject({ phase: "finished", status: "threw", callbackCount: 0 });
    expect(fixture.changes.observed).toBe(false);
  });

  it("attributes nested same-vector callbacks only to the innermost scope and marks the outer interval ambiguous", () => {
    const fixture = setup();
    let insideNested = false;
    jest.mocked(emitResource).mockImplementation(() => {
      if (!insideNested) {
        insideNested = true;
        emitQueueItemResource(fixture.scope);
        insideNested = false;
      }
      fixture.money.food -= 35;
      fixture.changes.next({ property: "resource.removed", data: {
        playerNumber: 2, playerStateData: { resources: fixture.scope.amounts }
      } });
    });
    emitQueueItemResource(fixture.scope);
    expect(fixture.records.map((record) => [record.operationId, record.phase])).toEqual([
      [1, "started"], [2, "started"], [2, "callback"], [2, "finished"], [1, "callback"], [1, "finished"]
    ]);
    expect(fixture.records[3]).toMatchObject({ callbackCount: 1, nestedEmission: false, balanceMatches: true });
    expect(fixture.records[5]).toMatchObject({ callbackCount: 1, nestedEmission: true, balanceMatches: false });
    expect(fixture.changes.observed).toBe(false);
  });

  it("marks malformed samples explicitly while preserving the actual shared call", () => {
    const fixture = setup();
    fixture.money.wood = NaN;
    fixture.scope.amounts.food = Infinity;
    emitQueueItemResource(fixture.scope);
    expect(emitResource).toHaveBeenCalledTimes(1);
    expect(fixture.records[0]).toMatchObject({ requested: null, before: null });
    expect(fixture.records[1]).toMatchObject({ amounts: null });
    expect(fixture.records[2]).toMatchObject({ after: null, balanceMatches: false });
    expect(JSON.stringify(fixture.records)).not.toContain("Infinity");
  });
});
