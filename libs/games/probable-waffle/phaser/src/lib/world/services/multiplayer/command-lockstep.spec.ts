import { Subject } from "rxjs";
import {
  ProbableWafflePlayerType,
  type ProbableWaffleGameCommandEvent,
  type GameCommand
} from "@fuzzy-waddle/probable-waffle-protocol";
import { commandBusTestScene } from "./command-bus-test-scene";
import { CommandLockstep } from "./command-lockstep";
import { SimulationTickService } from "../simulation-tick.service";

function setup() {
  const scene = commandBusTestScene();
  for (const player of scene.players) {
    const definition = player.playerController.data.playerDefinition;
    if (!definition) throw new Error("Missing fixture player definition");
    definition.playerType = ProbableWafflePlayerType.Human;
  }
  scene.baseGameData.user.userId = "ai-2";
  const incoming = new Subject<ProbableWaffleGameCommandEvent>(),
    sent: ProbableWaffleGameCommandEvent[] = [];
  Object.defineProperty(scene.baseGameData, "communicator", {
    value: {
      gameCommandChanged: { on: incoming, sendToServer: (event: ProbableWaffleGameCommandEvent) => sent.push(event) }
    }
  });
  const clock = new SimulationTickService(scene);
  scene.getSceneGameData().services.push(clock);
  const apply = jest.fn<void, [GameCommand, number?]>(),
    record = jest.fn(),
    report = jest.fn(),
    restore = jest.fn();
  const transport = new CommandLockstep(scene, apply, report, record, restore);
  transport.tryInitMultiplayer();
  return { scene, incoming, sent, clock, transport, apply };
}

describe("command relay ownership after extraction", () => {
  it("seeds empty startup slots and keeps a gameplay payload gated on its authoritative echo", () => {
    const f = setup();
    expect(f.sent.map((event) => event.tick)).toEqual([1, 2]);
    f.incoming.next({
      gameInstanceId: "authority-test",
      emitterUserId: "remote",
      tick: 2,
      playerNumber: 3,
      commands: []
    });
    expect(f.clock.isPaused).toBe(false);
    const command = { type: "CONCEDE", playerNumber: 2, actorIds: [], reason: "fixture", tick: 3 } as const;
    f.transport.pendingOutbound.set(3, [command]);
    f.clock.currentTick = 1;
    f.clock.tick$.next(1);
    f.clock.currentTick = 2;
    f.clock.tick$.next(2);
    expect(f.apply).not.toHaveBeenCalled();
    const batch = f.sent.find((event) => event.tick === 3);
    if (!batch) throw new Error("Missing sent batch");
    f.incoming.next(batch);
    f.incoming.next({ ...batch, playerNumber: 3, commands: [] });
    f.clock.currentTick = 3;
    f.clock.tick$.next(3);
    expect(f.apply).toHaveBeenCalledWith(command, 0);
    f.transport.destroy();
    f.scene.events.emit("shutdown");
  });
  it("keeps snapshot reseeding above the already sent frontier and disposes receive/stall ownership", () => {
    const f = setup();
    f.transport.lastSentExecutionTick = 7;
    f.transport.resetAfterSnapshot(2);
    expect(f.sent.slice(-2).map((event) => event.tick)).toEqual([8, 9]);
    expect(f.transport.buffer.hasPlayerCommit(8, 2)).toBe(true);
    f.transport.destroy();
    f.scene.events.emit("shutdown");
    expect(f.incoming.observers).toHaveLength(0);
    expect(f.transport.diagnostics.stallLogTimer).toBeNull();
  });
});
