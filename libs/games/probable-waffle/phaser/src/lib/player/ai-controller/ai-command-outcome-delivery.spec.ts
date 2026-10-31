import { Subject } from "rxjs";
import type { GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { AiCommandReconciliation } from "./ai-command-reconciliation";
import { installAiCommandOutcomeDelivery } from "./ai-command-outcome-delivery";

/** Unit authority checkpoint, not an executed Phaser recipe or proof of multiplayer save/host behavior. */
function checkpointFixture() {
  const stream = new Subject<GameCommandOutcome>(), history: GameCommandOutcome[] = [];
  const reported = jest.fn();
  const bus = { commandOutcome$: stream.asObservable(), getAuthorityState: () => ({ schemaVersion: 1,
    authorityEpoch: 0, nextSequenceByPlayer: {}, processedCommandIds: [], outcomes: [...history] }),
    reportPersistedOutcome: reported } as unknown as CommandBusService;
  const original: GameCommandOutcome = { schemaVersion: 1, kind: "dispatched", reason: "accepted_for_dispatch", tick: 0,
    playerNumber: 2, commandId: "original-command", commitmentKey: "original-effect", authorityEpoch: 0,
    sequence: 1, actorIds: ["producer"], worldLinkIds: [] };
  return { bus, stream, history, original, reported };
}

it("reconciles native completion history before late receipt, without requiring the output actor to still exist", () => {
  const f = checkpointFixture(), held: (() => void)[] = [];
  const remove = installAiCommandOutcomeDelivery(f.bus, 2, {
    deliver: (value, accept) => value.kind === "dispatched" ? accept(value) : held.push(() => accept(value)),
    history: (history) => history
  });
  const observer = jest.fn(); f.stream.subscribe(observer);
  const reconciliation = new AiCommandReconciliation(2, f.bus, 20);
  f.stream.next(f.original);
  const complete = { ...f.original, kind: "completed" as const, reason: "applied" as const,
    tick: 25, worldLinkIds: ["already-destroyed-output"] };
  f.history.push(complete); f.stream.next(complete);
  expect(observer).toHaveBeenCalledWith(complete);
  expect(reconciliation.getState().pendingCommandIds).toEqual([f.original.commandId]);
  reconciliation.observeTick(20);
  expect(reconciliation.getState().pendingCommandIds).toHaveLength(1);
  reconciliation.observeTick(40);
  expect(reconciliation.getState().pendingCommandIds).toEqual([]);
  held.forEach((deliver) => deliver());
  expect(reconciliation.getState().recentOutcomes.filter((entry) => entry.kind === "completed")).toHaveLength(1);
  expect(f.reported).not.toHaveBeenCalled();
  reconciliation.destroy(); remove();
});

it("retains unknown work during unavailable history and fences a retained callback after destruction", () => {
  const f = checkpointFixture(); let late: (() => void) | undefined;
  const remove = installAiCommandOutcomeDelivery(f.bus, 2, {
    deliver: (value, accept) => value.kind === "dispatched" ? accept(value) : late = () => accept(value),
    history: () => null
  });
  const reconciliation = new AiCommandReconciliation(2, f.bus);
  f.stream.next(f.original);
  f.stream.next({ ...f.original, kind: "completed", reason: "applied", tick: 25 });
  reconciliation.observeTick(1000);
  const saved = reconciliation.getState();
  expect(saved.pendingCommandIds).toEqual([f.original.commandId]);
  expect(saved.health).toBe("technical_fault");
  expect(f.reported).not.toHaveBeenCalled();
  reconciliation.destroy(); late?.();
  expect(reconciliation.getState()).toEqual(saved);
  expect(() => reconciliation.setState(saved, 1000)).toThrow("ai_reconciliation_disposed");
  remove();
});

it("keeps consumer ownership isolated across players and rejects overlapping installations", () => {
  const f = checkpointFixture(), deliver = jest.fn();
  const remove = installAiCommandOutcomeDelivery(f.bus, 2, { deliver, history: (history) => history });
  expect(() => installAiCommandOutcomeDelivery(f.bus, 2, { deliver, history: () => null }))
    .toThrow("ai_outcome_delivery_already_owned");
  const first = new AiCommandReconciliation(2, f.bus), other = new AiCommandReconciliation(3, f.bus);
  f.stream.next(f.original);
  expect(deliver).toHaveBeenCalledTimes(1);
  expect(other.getState().pendingCommandIds).toEqual([]);
  first.destroy(); other.destroy(); remove();
});

it("retains every terminal receipt in a full 128-command drain until the next brain observation", () => {
  const f = checkpointFixture(), reconciliation = new AiCommandReconciliation(2, f.bus);
  for (let index = 1; index <= 128; index++) f.stream.next({ ...f.original,
    commandId: `original-${index}`, commitmentKey: `effect-${index}`, sequence: index });
  for (let index = 1; index <= 128; index++) f.stream.next({ ...f.original,
    commandId: `original-${index}`, commitmentKey: `effect-${index}`, sequence: index,
    kind: "completed", reason: "applied", tick: 100 });
  expect(reconciliation.getState().pendingCommandIds).toEqual([]);
  expect(reconciliation.getState().recentOutcomes.filter((entry) => entry.kind === "completed")).toHaveLength(128);
  reconciliation.destroy();
});
