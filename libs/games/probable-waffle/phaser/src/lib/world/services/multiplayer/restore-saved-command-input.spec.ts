import type { GameCommand, ProbableWaffleReplayCommandBatch } from "@fuzzy-waddle/probable-waffle-protocol";
import { commandBusTestScene } from "./command-bus-test-scene";
import { CommandLockstep } from "./command-lockstep";
import { SimulationTickService } from "../simulation-tick.service";
import { restoreSavedCommandInput } from "./restore-saved-command-input";

function setup() {
  const scene = commandBusTestScene();
  scene.baseGameData.gameInstance.gameInstanceMetadata.data.startOptions.loadFromSave = true;
  const clock = new SimulationTickService(scene, 900);
  scene.getSceneGameData().services.push(clock);
  const command: GameCommand = { type: "CONCEDE", playerNumber: 2, actorIds: [], reason: "saved-input", tick: 901,
    execution: { schemaVersion: 1, commandId: "2:0:4:authority-test", commitmentKey: "saved-work", source: "ai",
      authorityEpoch: 0, sequence: 4, effectId: "effect:saved", intentId: "intent:saved" } };
  const batches: ProbableWaffleReplayCommandBatch[] = [{ tick: 901, playerNumber: 2, commands: [command] }];
  const state = scene.baseGameData.gameInstance.gameState;
  if (!state) throw new Error("Missing saved state");
  state.data.commandAuthority = { schemaVersion: 1, authorityEpoch: 0, nextSequenceByPlayer: { 2: 5 },
    processedCommandIds: [], outcomes: [] };
  state.data.pendingCommandBatches = structuredClone(batches);
  const apply = jest.fn(), transport = new CommandLockstep(scene, apply, jest.fn(), jest.fn(), jest.fn());
  transport.localPlayerNumber = 2;
  return { scene, clock, command, batches, state, apply, transport };
}

it("restores detached original unsent input above the saved clock without applying or minting identity", () => {
  const f = setup();
  restoreSavedCommandInput(f.transport, CommandLockstep.INPUT_DELAY_TICKS);
  const commands = f.transport.pendingOutbound.get(903);
  expect(commands).toEqual([{ ...f.command, tick: 903 }]);
  expect(commands?.[0].execution).toEqual(f.command.execution);
  expect(f.apply).not.toHaveBeenCalled();
  expect(f.state.data.pendingCommandBatches).toEqual(f.batches);
  f.transport.destroy();
  f.scene.events.emit("shutdown");
});

it("fails a malformed tail before publishing any earlier valid command", () => {
  const f = setup();
  f.state.data.pendingCommandBatches?.push({ tick: 902, playerNumber: 99, commands: [{ ...f.command, tick: 902 }] });
  expect(() => restoreSavedCommandInput(f.transport, CommandLockstep.INPUT_DELAY_TICKS)).toThrow("invalid_saved_command_batch");
  expect(f.transport.pendingOutbound.size).toBe(0);
  f.transport.destroy();
  f.scene.events.emit("shutdown");
});

it("does not replay work already admitted by the saved authority frontier", () => {
  const f = setup();
  f.state.data.commandAuthority = { schemaVersion: 1, authorityEpoch: 0, nextSequenceByPlayer: { 2: 5 },
    processedSequenceWatermarkByPlayer: { 2: 4 }, processedCommandIds: [], outcomes: [] };
  restoreSavedCommandInput(f.transport, CommandLockstep.INPUT_DELAY_TICKS);
  expect(f.transport.pendingOutbound.size).toBe(0);
  f.transport.destroy();
  f.scene.events.emit("shutdown");
});
