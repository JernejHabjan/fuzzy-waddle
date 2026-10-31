import { ProbableWaffleGameCommandTypes, ProbableWafflePlayerType, type GameCommand,
  type ProbableWaffleGameCommandEvent } from "@fuzzy-waddle/probable-waffle-protocol";
import { Subject } from "rxjs";
import { SimulationTickService } from "../simulation-tick.service";
import { CommandBusService } from "./command-bus.service";
import { CommandAuthority } from "./command-authority";
import { commandBusTestScene } from "./command-bus-test-scene";
import { AiCommandReconciliation } from "../../../player/ai-controller/ai-command-reconciliation";

/** Real bus admission/restore controls; no rendered world, payment or multiplayer pass is inferred. */
function setup() {
  const scene = commandBusTestScene(), bus = new CommandBusService(scene);
  const reconciliation = new AiCommandReconciliation(2, bus);
  const applied: GameCommand[] = [];
  bus.command$.subscribe((command) => {
    applied.push(command);
    bus.reportOutcome(command, "applied", "applied");
  });
  const issue = (key = "original") => {
    const receipt = bus.dispatchAi({ type: ProbableWaffleGameCommandTypes.Concede,
      playerNumber: 2, actorIds: [], reason: "authority-control" },
    { commitmentKey: key, effectId: `effect:${key}`, intentId: `intent:${key}` });
    if (receipt.status !== "dispatched") throw new Error("authority_control_dispatch_failed");
    return receipt.command;
  };
  return { scene, bus, reconciliation, applied, issue };
}

it("keeps admitted ownership and original age across host transfer, duplicate delivery and old completion", () => {
  const f = setup(), original = f.issue(), pending = f.reconciliation.getState().pendingCommands;
  f.bus.advanceAuthorityEpoch(1);
  f.reconciliation.observeTick(20);
  expect(f.reconciliation.getState().pendingCommands).toEqual(pending);
  f.bus.playReplayBatch({ tick: original.tick, playerNumber: 2, commands: [original] });
  expect(f.applied).toEqual([original]);
  expect(f.reconciliation.getState().pendingCommandIds).toEqual([original.execution?.commandId]);
  f.issue();
  expect(f.applied).toEqual([original]);
  expect(f.reconciliation.getState().pendingCommandIds).toEqual([original.execution?.commandId]);
  const cursor = f.reconciliation.getState().processedSequenceWatermark;
  f.bus.reportOutcome(original, "completed", "applied");
  expect(f.reconciliation.getState().pendingCommandIds).toEqual([]);
  // An old sequence cannot raise the new epoch's terminal cursor.
  expect(f.reconciliation.getState().processedSequenceWatermark).toBe(cursor);
  f.issue();
  expect(f.applied).toHaveLength(2);
  f.reconciliation.destroy();
  f.bus.destroy();
});

it("does not treat a same-epoch duplicate rejection as terminal failure in either runtime or pure ownership", () => {
  const f = setup(), original = f.issue();
  f.bus.playReplayBatch({ tick: original.tick, playerNumber: 2, commands: [original] });
  expect(f.reconciliation.getState().pendingCommandIds).toEqual([original.execution?.commandId]);
  expect(f.reconciliation.getBrainOutcomes("authority-test").some((entry) => entry.kind === "rejected")).toBe(false);
  f.bus.reportOutcome(original, "completed", "applied");
  expect(f.reconciliation.getState().pendingCommandIds).toEqual([]);
  f.reconciliation.destroy();
  f.bus.destroy();
});

it("preserves unresolved identity past real retention pressure and rejects compacted replay after JSON restore", () => {
  const f = setup(), unresolved = f.issue();
  for (let index = 0; index <= CommandAuthority.PROCESSED_COMMAND_LIMIT; index++) {
    const command = f.issue(`completed-${index}`);
    f.bus.reportOutcome(command, "completed", "applied");
  }
  const execution = unresolved.execution;
  if (!execution) throw new Error("Missing original execution");
  const saved = JSON.parse(JSON.stringify(f.bus.getAuthorityState()));
  expect(saved.processedCommandIds).not.toContain(unresolved.execution?.commandId);
  expect(saved.activeCommitmentsByPlayer[2].original).toBe(unresolved.execution?.commandId);
  expect(saved.activeCommandProgress[execution.commandId].execution).toEqual(unresolved.execution);
  const restored = new CommandBusService(commandBusTestScene(saved)), application = jest.fn();
  restored.command$.subscribe(application);
  restored.playReplayBatch({ tick: unresolved.tick, playerNumber: 2, commands: [unresolved] });
  expect(application).not.toHaveBeenCalled();
  expect(restored.getAuthorityState().activeCommitmentsByPlayer?.[2]?.original).toBe(unresolved.execution?.commandId);
  restored.reportOutcome({ ...unresolved, execution: { ...execution, sequence: execution.sequence + 1 } }, "completed", "applied");
  expect(restored.getAuthorityState().activeCommitmentsByPlayer?.[2]?.original).toBe(execution.commandId);
  restored.reportOutcome(unresolved, "completed", "applied");
  expect(restored.getAuthorityState().activeCommitmentsByPlayer?.[2]?.original).toBeUndefined();
  restored.destroy();
  f.reconciliation.destroy();
  f.bus.destroy();
});

it("fences every retained bus entry point after scene shutdown without changing saved authority", () => {
  const f = setup(), original = f.issue();
  f.scene.events.emit("shutdown");
  const boundary = f.bus.getAuthorityState();
  expect(f.bus.dispatchAi({ type: ProbableWaffleGameCommandTypes.Concede, playerNumber: 2, actorIds: [], reason: "late" },
    { commitmentKey: "late", intentId: "late", effectId: "late" }).status).toBe("rejected");
  f.bus.reportOutcome(original, "completed", "applied");
  const first = boundary.outcomes[0];
  if (!first) throw new Error("Missing original dispatch");
  f.bus.reportPersistedOutcome({ ...first, kind: "completed" });
  f.bus.advanceAuthorityEpoch(99);
  f.bus.playReplayBatch({ tick: 100, playerNumber: 2, commands: [original] });
  f.bus.resetAfterSnapshot(100, [], { ...boundary, authorityEpoch: 99 });
  f.bus.tryInitMultiplayer();
  expect(f.bus.getAuthorityState()).toEqual(boundary);
  expect(f.applied).toEqual([original]);
  f.reconciliation.destroy();
});

it("retires only definitely-unsent epoch input and preserves that real cancellation for pure claim release", () => {
  const scene = commandBusTestScene();
  for (const player of scene.players) {
    const definition = player.playerController.data.playerDefinition;
    if (definition) definition.playerType = ProbableWafflePlayerType.Human;
  }
  scene.baseGameData.user.userId = "ai-2";
  const incoming = new Subject<ProbableWaffleGameCommandEvent>();
  Object.defineProperty(scene.baseGameData, "communicator", { value: {
    gameCommandChanged: { on: incoming, sendToServer: () => undefined }
  } });
  const clock = new SimulationTickService(scene, 900);
  scene.getSceneGameData().services.push(clock);
  const bus = new CommandBusService(scene), reconciliation = new AiCommandReconciliation(2, bus);
  bus.tryInitMultiplayer();
  const receipt = bus.dispatchAi({ type: ProbableWaffleGameCommandTypes.Concede, playerNumber: 2,
    actorIds: [], reason: "unsent-control" }, { commitmentKey: "unsent", intentId: "intent:unsent", effectId: "effect:unsent" });
  if (receipt.status !== "dispatched") throw new Error("Missing original unsent request");
  expect(bus.getPendingCommandBatches().flatMap((batch) => batch.commands)).toEqual([receipt.command]);
  expect(bus.getAuthorityState().processedCommandIds).toEqual([]);
  bus.advanceAuthorityEpoch(1);
  reconciliation.observeTick(920);
  expect(bus.getPendingCommandBatches()).toEqual([]);
  expect(reconciliation.getState().pendingCommandIds).toEqual([]);
  expect(reconciliation.getBrainOutcomes("authority-test")).toContainEqual(expect.objectContaining({
    kind: "cancelled", reason: "cancelled", identity: expect.objectContaining({
      commandId: `command:${receipt.command.execution?.commandId}`, authorityEpoch: 0
    })
  }));
  reconciliation.destroy();
  bus.destroy();
  scene.events.emit("shutdown");
});
