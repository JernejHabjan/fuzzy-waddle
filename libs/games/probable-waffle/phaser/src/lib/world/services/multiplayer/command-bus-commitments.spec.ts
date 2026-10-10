import {
  ProbableWaffleGameCommandTypes,
  type GameCommand,
  type GameCommandAuthorityState
} from "@fuzzy-waddle/probable-waffle-protocol";
import { CommandBusService } from "./command-bus.service";
import { commandBusTestScene } from "./command-bus-test-scene";

const key = "ai:bootstrap-worker:effect:0:0";
function setup(saved?: GameCommandAuthorityState) {
  const scene = commandBusTestScene(saved),
    bus = new CommandBusService(scene);
  const applied: GameCommand[] = [];
  bus.command$.subscribe((command) => applied.push(command));
  return { bus, applied };
}
function issue(bus: CommandBusService, playerNumber: number, commitmentKey = key) {
  const receipt = bus.dispatchAi(
    { type: ProbableWaffleGameCommandTypes.Concede, playerNumber, actorIds: [], reason: "fixture" },
    { intentId: "intent", effectId: "effect", commitmentKey }
  );
  if (receipt.status !== "dispatched") throw new Error("Fixture command was not dispatched");
  return receipt.command;
}

describe("player-scoped command commitments", () => {
  it.each([key, "ai:effect:stage9:0:neutral:sim-173fcbde", "2:opaque:key", "__proto__"])(
    "admits equal opaque keys from different players: %s",
    (commitmentKey) => {
      const { bus, applied } = setup();
      issue(bus, 2, commitmentKey);
      issue(bus, 3, commitmentKey);
      expect(applied.map((command) => command.playerNumber)).toEqual([2, 3]);
      expect(bus.getAuthorityState().outcomes.filter((outcome) => outcome.reason === "duplicate_command")).toEqual([]);
      bus.destroy();
    }
  );

  it("keeps same-player duplicates blocked and releases only the completed player's key", () => {
    const { bus, applied } = setup();
    const first = issue(bus, 2);
    const other = issue(bus, 3);
    issue(bus, 2);
    expect(applied).toEqual([first, other]);
    bus.reportOutcome(first, "completed", "applied");
    issue(bus, 2);
    issue(bus, 3);
    expect(applied.map((command) => command.playerNumber)).toEqual([2, 3, 2]);
    bus.destroy();
  });

  it("does not release a key when an outcome names a different player", () => {
    const { bus, applied } = setup();
    const command = issue(bus, 2);
    bus.reportOutcome({ ...command, playerNumber: 3 }, "completed", "applied");
    issue(bus, 2);
    expect(applied).toEqual([command]);
    bus.destroy();
  });

  it("retains both players' pending commitments across JSON save and snapshot reset", () => {
    const { bus } = setup();
    const first = issue(bus, 2);
    const other = issue(bus, 3);
    const serialized = JSON.stringify(bus.getAuthorityState());
    const saved: GameCommandAuthorityState = JSON.parse(serialized);
    const restored = setup(saved);
    issue(restored.bus, 2);
    issue(restored.bus, 3);
    expect(restored.applied).toEqual([]);
    restored.bus.resetAfterSnapshot(0, [], saved);
    restored.bus.reportOutcome(first, "completed", "applied");
    issue(restored.bus, 2);
    issue(restored.bus, 3);
    expect(restored.applied.map((command) => command.playerNumber)).toEqual([2]);
    expect(restored.bus.getAuthorityState().activeCommitmentsByPlayer?.[3]?.[key]).toBe(other.execution?.commandId);
    restored.bus.advanceAuthorityEpoch(1);
    issue(restored.bus, 2);
    issue(restored.bus, 3);
    expect(restored.applied.map((command) => command.playerNumber)).toEqual([2, 2, 3]);
    restored.bus.destroy();
    bus.destroy();
  });

  it("restores legacy global keys without stealing their player's ownership", () => {
    const { bus } = setup();
    const first = issue(bus, 2),
      snapshot = bus.getAuthorityState();
    const { activeCommitmentsByPlayer: _scoped, ...rest } = snapshot;
    if (!first.execution) throw new Error("Missing command execution");
    const saved = {
      ...rest,
      activeCommitments: { [key]: first.execution.commandId }
    } satisfies GameCommandAuthorityState;
    const restored = setup(saved);
    issue(restored.bus, 2);
    issue(restored.bus, 3);
    expect(restored.applied.map((command) => command.playerNumber)).toEqual([3]);
    restored.bus.reportOutcome(first, "completed", "applied");
    issue(restored.bus, 2);
    expect(restored.applied.map((command) => command.playerNumber)).toEqual([3, 2]);
    restored.bus.destroy();
    bus.destroy();
  });
});

describe("restored aggregate command progress", () => {
  it("waits for every actor and ignores duplicate delivery diagnostics after restore", () => {
    const saved = {
      schemaVersion: 1,
      authorityEpoch: 0,
      nextSequenceByPlayer: { 2: 1 },
      processedCommandIds: ["2:0:0:test"],
      activeCommitmentsByPlayer: { 2: { [key]: "2:0:0:test" } },
      activeCommandProgress: { "2:0:0:test": { expectedActorIds: ["a", "b"], terminalActorIds: [] } },
      outcomes: [
        {
          schemaVersion: 1,
          kind: "rejected",
          reason: "duplicate_command",
          tick: 0,
          playerNumber: 2,
          commandId: "2:0:0:test",
          commitmentKey: key,
          authorityEpoch: 0,
          sequence: 0,
          actorIds: ["a", "b"],
          worldLinkIds: []
        }
      ]
    } satisfies GameCommandAuthorityState;
    const { bus, applied } = setup(saved);
    const diagnostic = saved.outcomes[0];
    if (!diagnostic) throw new Error("Missing fixture diagnostic");
    const terminal = { ...diagnostic, kind: "completed", reason: "applied" } as const;
    bus.reportPersistedOutcome({ ...terminal, actorIds: ["a"] });
    issue(bus, 2);
    expect(applied).toEqual([]);
    const roundTrip = setup(bus.getAuthorityState());
    roundTrip.bus.reportPersistedOutcome({ ...terminal, actorIds: ["b"] });
    issue(roundTrip.bus, 2);
    expect(roundTrip.applied).toHaveLength(1);
    bus.destroy();
    roundTrip.bus.destroy();
  });
});
