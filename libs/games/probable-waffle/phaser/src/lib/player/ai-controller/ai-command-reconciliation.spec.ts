import { Subject } from "rxjs";
import type { GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import { AiCommandReconciliation } from "./ai-command-reconciliation";
import type { CommandBusService } from "../../world/services/multiplayer/command-bus.service";

const outcome = (
  kind: GameCommandOutcome["kind"],
  sequence: number,
  actorIds: readonly string[] = ["actor-a", "actor-b"]
): GameCommandOutcome => ({
  schemaVersion: 1,
  kind,
  reason: kind === "dispatched" ? "accepted_for_dispatch" : "applied",
  tick: sequence,
  playerNumber: 2,
  commandId: `2:0:${sequence}:game`,
  commitmentKey: `commitment-${sequence}`,
  authorityEpoch: 0,
  sequence,
  actorIds,
  worldLinkIds: []
});

describe("AiCommandReconciliation", () => {
  it("waits for every addressed actor before advancing the terminal watermark", () => {
    const outcomes = new Subject<GameCommandOutcome>();
    const bus = {
      commandOutcome$: outcomes.asObservable(),
      getAuthorityState: () => ({
        schemaVersion: 1 as const,
        authorityEpoch: 0,
        nextSequenceByPlayer: {},
        processedCommandIds: [],
        outcomes: []
      }),
      reportPersistedOutcome: (entry: GameCommandOutcome) => outcomes.next(entry)
    } as unknown as CommandBusService;
    const reconciliation = new AiCommandReconciliation(2, bus);

    outcomes.next(outcome("dispatched", 4));
    outcomes.next(outcome("completed", 4, ["actor-a"]));
    expect(reconciliation.getState().pendingCommandIds).toEqual(["2:0:4:game"]);
    outcomes.next(outcome("completed", 4, ["actor-b"]));
    expect(reconciliation.getState()).toMatchObject({
      processedSequenceWatermark: 4,
      pendingCommandIds: [],
      pendingCommands: [],
      health: "healthy"
    });
  });

  it("turns a missing terminal outcome into a bounded technical fault", () => {
    const outcomes = new Subject<GameCommandOutcome>();
    const emitted: GameCommandOutcome[] = [];
    const bus = {
      commandOutcome$: outcomes.asObservable(),
      getAuthorityState: () => ({
        schemaVersion: 1 as const,
        authorityEpoch: 0,
        nextSequenceByPlayer: {},
        processedCommandIds: [],
        outcomes: []
      }),
      reportPersistedOutcome: (entry: GameCommandOutcome) => {
        emitted.push(entry);
        outcomes.next(entry);
      }
    } as unknown as CommandBusService;
    const reconciliation = new AiCommandReconciliation(2, bus);
    outcomes.next(outcome("dispatched", 5, ["actor-a"]));
    reconciliation.observeTick(905);
    expect(emitted.at(-1)).toMatchObject({ kind: "failed", reason: "lost_outcome", commandId: "2:0:5:game" });
    expect(reconciliation.getState().health).toBe("technical_fault");
  });

  it("retains applied history while waiting for a delayed terminal outcome", () => {
    const outcomes = new Subject<GameCommandOutcome>();
    const emitted: GameCommandOutcome[] = [];
    const bus = {
      commandOutcome$: outcomes.asObservable(),
      getAuthorityState: () => ({
        schemaVersion: 1 as const,
        authorityEpoch: 0,
        nextSequenceByPlayer: {},
        processedCommandIds: [],
        outcomes: []
      }),
      reportPersistedOutcome: (entry: GameCommandOutcome) => {
        emitted.push(entry);
        outcomes.next(entry);
      }
    } as unknown as CommandBusService;
    const reconciliation = new AiCommandReconciliation(2, bus);
    outcomes.next(outcome("dispatched", 6, ["producer"]));
    outcomes.next({ ...outcome("applied", 6, ["producer"]), worldLinkIds: ["queue:producer:6"] });

    reconciliation.observeTick(906);
    expect(emitted).toEqual([]);
    expect(reconciliation.getState()).toMatchObject({
      pendingCommandIds: ["2:0:6:game"],
      health: "reconciling"
    });

    reconciliation.observeTick(7206);
    expect(emitted.at(-1)).toMatchObject({ kind: "failed", reason: "lost_outcome" });
    expect(reconciliation.getState().recentOutcomes).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "applied", worldLinkIds: ["queue:producer:6"] })])
    );
  });

  it("settles from authoritative completion even when the resulting actor is already absent", () => {
    const outcomes = new Subject<GameCommandOutcome>();
    const bus = {
      commandOutcome$: outcomes.asObservable(),
      getAuthorityState: () => ({
        schemaVersion: 1 as const,
        authorityEpoch: 0,
        nextSequenceByPlayer: {},
        processedCommandIds: [],
        outcomes: []
      }),
      reportPersistedOutcome: (entry: GameCommandOutcome) => outcomes.next(entry)
    } as unknown as CommandBusService;
    const reconciliation = new AiCommandReconciliation(2, bus);
    outcomes.next(outcome("dispatched", 7, ["producer"]));
    outcomes.next({ ...outcome("completed", 7, ["producer"]), worldLinkIds: ["consumed-unit"] });

    expect(reconciliation.getState()).toMatchObject({
      processedSequenceWatermark: 7,
      pendingCommandIds: [],
      health: "healthy"
    });
  });

  it("fences late outcomes from a previous authority epoch", () => {
    const outcomes = new Subject<GameCommandOutcome>();
    const bus = {
      commandOutcome$: outcomes.asObservable(),
      getAuthorityState: () => ({
        schemaVersion: 1 as const,
        authorityEpoch: 1,
        nextSequenceByPlayer: {},
        processedCommandIds: [],
        outcomes: []
      }),
      reportPersistedOutcome: (entry: GameCommandOutcome) => outcomes.next(entry)
    } as unknown as CommandBusService;
    const reconciliation = new AiCommandReconciliation(2, bus);
    outcomes.next(outcome("dispatched", 1));
    expect(reconciliation.getState().recentOutcomes).toEqual([]);
  });

  it("restores a saved unresolved frontier and advances it only after terminal evidence", () => {
    const outcomes = new Subject<GameCommandOutcome>();
    const bus = {
      commandOutcome$: outcomes.asObservable(),
      getAuthorityState: () => ({
        schemaVersion: 1 as const,
        authorityEpoch: 0,
        nextSequenceByPlayer: {},
        processedCommandIds: [],
        outcomes: []
      }),
      reportPersistedOutcome: (entry: GameCommandOutcome) => outcomes.next(entry)
    } as unknown as CommandBusService;
    const reconciliation = new AiCommandReconciliation(2, bus);
    reconciliation.setState(
      {
        schemaVersion: 1,
        authorityEpoch: 0,
        processedSequenceWatermark: 8,
        pendingCommandIds: ["2:0:9:game"],
        recentOutcomes: [outcome("dispatched", 9, ["actor-a"])],
        health: "reconciling"
      },
      100
    );

    outcomes.next(outcome("completed", 9, ["actor-a"]));
    expect(reconciliation.getState()).toMatchObject({
      processedSequenceWatermark: 9,
      pendingCommandIds: [],
      health: "healthy"
    });
  });

  it("preserves an unresolved command's causal age and partial actor progress across save restore", () => {
    const outcomes = new Subject<GameCommandOutcome>();
    const emitted: GameCommandOutcome[] = [];
    const bus = {
      commandOutcome$: outcomes.asObservable(),
      getAuthorityState: () => ({
        schemaVersion: 1 as const,
        authorityEpoch: 0,
        nextSequenceByPlayer: {},
        processedCommandIds: [],
        outcomes: []
      }),
      reportPersistedOutcome: (entry: GameCommandOutcome) => {
        emitted.push(entry);
        outcomes.next(entry);
      }
    } as unknown as CommandBusService;
    const original = new AiCommandReconciliation(2, bus);
    outcomes.next({ ...outcome("dispatched", 10), tick: 10 });
    outcomes.next({ ...outcome("active", 10, ["actor-a"]), tick: 20 });
    outcomes.next({ ...outcome("completed", 10, ["actor-a"]), tick: 30 });
    const saved = original.getState();
    expect(saved.pendingCommands?.[0]).toMatchObject({
      lastProgressTick: 30,
      applicationObserved: true,
      terminalActorIds: ["actor-a"]
    });
    original.destroy();

    const restored = new AiCommandReconciliation(2, bus);
    restored.setState(saved, 7_000);
    restored.observeTick(7_229);
    expect(emitted).toEqual([]);
    restored.observeTick(7_230);
    expect(emitted.at(-1)).toMatchObject({ kind: "failed", reason: "lost_outcome" });
  });

  it("bounds the unresolved backlog with an explicit technical outcome", () => {
    const outcomes = new Subject<GameCommandOutcome>();
    const emitted: GameCommandOutcome[] = [];
    const bus = {
      commandOutcome$: outcomes.asObservable(),
      getAuthorityState: () => ({
        schemaVersion: 1 as const,
        authorityEpoch: 0,
        nextSequenceByPlayer: {},
        processedCommandIds: [],
        outcomes: []
      }),
      reportPersistedOutcome: (entry: GameCommandOutcome) => {
        emitted.push(entry);
        outcomes.next(entry);
      }
    } as unknown as CommandBusService;
    const reconciliation = new AiCommandReconciliation(2, bus);
    for (let sequence = 0; sequence <= 128; sequence += 1) {
      outcomes.next(outcome("dispatched", sequence, [`actor-${sequence}`]));
    }

    expect(emitted.at(-1)).toMatchObject({
      kind: "failed",
      reason: "outcome_backlog_overflow",
      commandId: "2:0:0:game"
    });
    expect(reconciliation.getState()).toMatchObject({ health: "technical_fault" });
    expect(reconciliation.getState().pendingCommandIds).toHaveLength(128);
    expect(reconciliation.getState().pendingCommands).toHaveLength(128);
  });
});
