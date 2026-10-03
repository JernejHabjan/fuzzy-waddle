import { Subject } from "rxjs";
import { ObjectNames, type GameCommand, type GameCommandInput, type GameCommandOutcome } from
  "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import type { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { AiRuntimeProductionCapture } from "./ai-runtime-production-capture";
import { prepareAiMultiplayerQueueWorld } from "./prepare-ai-multiplayer-queue-world";
import { AiMultiplayerQueueWorld } from "./ai-multiplayer-queue-world";

jest.mock("./ai-runtime-production-capture");
jest.mock("./prepare-ai-multiplayer-queue-world");
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

function fixture(localPlayerNumber = 1) {
  const outcomes = new Subject<GameCommandOutcome>();
  const commands = new Subject<GameCommand>();
  const ticks = { currentTick: 0, tick$: new Subject<number>() };
  const cash = { food: 75, wood: 0, stone: 0, minerals: 0 };
  const snapshot = { tick: 0, observation: null, capabilityCatalog: null, ownedActors: [], economyProduction: null,
    reservations: [], resources: cash, pendingCommands: [], pendingResourceClaims: cash, obligations: cash,
    queues: [], completedResearch: [] };
  const capture = {
    captureHumanQueueBoundary: jest.fn(() => ({ schemaVersion: 1, kind: "production_authority_capture", startedTick: 0,
      playerNumber: 1, droppedFactCount: 0, droppedSnapshotCount: 0, gaps: [], facts: [], snapshots: [{
        ...snapshot, tick: ticks.currentTick
      }] })), dispose: jest.fn()
  };
  jest.mocked(AiRuntimeProductionCapture).mockImplementation(() => capture as never);
  jest.mocked(getSceneService).mockReturnValue(ticks as never);
  jest.mocked(prepareAiMultiplayerQueueWorld).mockReturnValue({ tick: 1, playerNumber: 1, producerActorId: "producer",
    product: ObjectNames.TivaraWorker, price: { food: 50 }, refundFactor: 0.5, durationMs: 5000, initialResources: cash });
  const scene = { playerOrNull: { playerNumber: localPlayerNumber }, events: { once: jest.fn(), off: jest.fn() } } as
    unknown as ProbableWaffleScene;
  const sent: GameCommand[] = [];
  const dispatch = jest.fn((input: GameCommandInput) => {
    const sequence = sent.length;
    const command = { ...input, tick: ticks.currentTick + 2,
      execution: { schemaVersion: 1, commandId: ["purchase", "probe", "cancel", "resume"][sequence],
        commitmentKey: `test:${sequence}`, source: "human", authorityEpoch: 0, sequence } } satisfies GameCommand;
    sent.push(command);
    return { status: "dispatched", command } as const;
  });
  const bus = { commandOutcome$: outcomes, command$: commands, dispatch } as unknown as CommandBusService;
  const world = new AiMultiplayerQueueWorld(scene, bus);
  const step = (tick: number) => { ticks.currentTick = tick; ticks.tick$.next(tick); };
  const applied = () => outcomes.next({ schemaVersion: 1, kind: "applied", reason: "applied", tick: 3, playerNumber: 1,
    commandId: "purchase", commitmentKey: "test:0", authorityEpoch: 0, sequence: 0, actorIds: ["producer"], worldLinkIds: [] });
  return { world, outcomes, commands, ticks, capture, sent, dispatch, step, applied };
}

describe("buffered multiplayer queue experiment scheduling (mocked bus, no network proof)", () => {
  it("waits a simulation tick between probe and cancellation instead of sending them into the same batch", () => {
    const f = fixture();
    f.step(1);
    f.world.start();
    f.ticks.currentTick = 3;
    f.applied();
    f.step(3);
    expect(f.sent).toHaveLength(1);
    f.step(4);
    expect(f.sent[1]).toMatchObject({ type: "PRODUCTION", tick: 6 });
    f.step(5);
    expect(f.sent[2]).toMatchObject({ type: "CANCEL_PRODUCTION", tick: 7 });
    expect(f.world.getSnapshot().requests.find((request) => request.role === "cancel")).toMatchObject({ requestedTick: 5 });
    expect(f.world.getSnapshot().checkpoints.at(-1)?.boundary).toBe("cancel_pending");
    const calls = f.capture.captureHumanQueueBoundary.mock.calls.length;
    f.world.getSnapshot();
    f.world.getSnapshot();
    expect(f.capture.captureHumanQueueBoundary).toHaveBeenCalledTimes(calls);
    expect(() => f.world.start()).toThrow("multiplayer_queue_world_sender_not_ready");
    f.world.destroy();
    f.world.destroy();
    f.step(6);
    expect(f.dispatch).toHaveBeenCalledTimes(3);
    expect(f.capture.dispose).toHaveBeenCalledTimes(1);
    expect(f.outcomes.observed).toBe(false);
    expect(f.commands.observed).toBe(false);
    expect(f.ticks.tick$.observed).toBe(false);
  });

  it("leaves the remote peer passive", () => {
    const f = fixture(2);
    f.step(1);
    expect(() => f.world.start()).toThrow("multiplayer_queue_world_sender_not_ready");
    f.applied();
    f.step(4);
    f.step(5);
    expect(f.dispatch).not.toHaveBeenCalled();
    expect(f.world.getSnapshot().requests).toEqual([]);
    f.world.destroy();
  });

  it("fails closed if the clock skips past the probe before requesting cancellation", () => {
    const f = fixture();
    f.step(1);
    f.world.start();
    f.ticks.currentTick = 3;
    f.applied();
    f.step(4);
    f.step(6);
    expect(f.world.getSnapshot()).toMatchObject({ state: "failed",
      failure: "multiplayer_queue_probe_applied_before_cancel_request" });
    expect(f.dispatch).toHaveBeenCalledTimes(2);
    f.world.destroy();
  });
});
