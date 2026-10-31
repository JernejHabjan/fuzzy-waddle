import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { Subject } from "rxjs";
import {
  ObjectNames,
  ResearchType,
  type GameCommand,
  type GameCommandInput,
  type GameCommandOutcome
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import type { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { AiRuntimeProductionCapture } from "./ai-runtime-production-capture";
import { prepareAiMultiplayerSharedQueueWorld } from "./prepare-ai-multiplayer-shared-queue-world";
import { AiMultiplayerSharedQueueWorld } from "./ai-multiplayer-shared-queue-world";
import type { AiMultiplayerSharedQueueWorldV1 } from "./ai-multiplayer-shared-queue-world-v1";

jest.mock("./ai-runtime-production-capture");
jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("./prepare-ai-multiplayer-shared-queue-world", () => ({
  prepareAiMultiplayerSharedQueueWorld: jest.fn(),
  SHARED_QUEUE_CANCEL_WINDOW_TICKS: 20,
  SHARED_QUEUE_STABILITY_TICKS: 20
}));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

function fixture(branch: AiMultiplayerSharedQueueWorldV1["branch"], localPlayerNumber = 1) {
  const outcomes = new Subject<GameCommandOutcome>();
  const commands = new Subject<GameCommand>();
  const ticks = { currentTick: 0, tick$: new Subject<number>() };
  const scene = {
    playerOrNull: { playerNumber: localPlayerNumber },
    events: { once: jest.fn(), off: jest.fn() }
  } as unknown as ProbableWaffleScene;
  let indexed = false;
  let researched = false;
  const actor = { active: true, scene, name: ObjectNames.TivaraWorkerMale };
  jest
    .mocked(getActorComponent)
    .mockImplementation((_actor, component) =>
      component === OwnerComponent ? ({ getOwner: () => 1 } as never) : undefined
    );
  jest.mocked(getSceneService).mockImplementation((_scene, service) => {
    if (service === SimulationTickService) return ticks as never;
    if (service === ActorIndexSystem) return { getActorById: () => (indexed ? actor : undefined) } as never;
    if (service === TechTreeService) return { isResearched: () => researched } as never;
    return undefined;
  });
  const cash = { food: 50, wood: 150, stone: 0, minerals: 278 };
  const snapshot = {
    observation: null,
    capabilityCatalog: null,
    economyProduction: null,
    reservations: [],
    ownedActors: [],
    resources: cash,
    pendingCommands: [],
    pendingResourceClaims: cash,
    obligations: cash,
    completedResearch: [],
    queues: [
      {
        actorId: "producer",
        objectName: ObjectNames.Sandhold,
        lanes: [
          {
            laneId: "producer:lane:0",
            capacity: 5,
            items: [
              {
                itemId: "queue:producer:purchase",
                commandId: "purchase",
                researchType: ResearchType.TivaraSlingshotUpgradeLevel2
              }
            ]
          }
        ]
      }
    ]
  };
  const capture = {
    captureHumanQueueBoundary: jest.fn(() => ({
      schemaVersion: 1,
      kind: "production_authority_capture",
      startedTick: 0,
      playerNumber: 1,
      droppedFactCount: 0,
      droppedSnapshotCount: 0,
      gaps: [],
      facts: [],
      snapshots: [{ ...snapshot, tick: ticks.currentTick }]
    })),
    dispose: jest.fn()
  };
  jest.mocked(AiRuntimeProductionCapture).mockImplementation(() => capture as never);
  jest.mocked(prepareAiMultiplayerSharedQueueWorld).mockReturnValue({
    tick: 1,
    playerNumber: 1,
    producerActorId: "producer",
    producerObjectName: ObjectNames.Sandhold,
    initialResources: cash,
    train: {
      product: ObjectNames.TivaraWorker,
      spawnObjectNames: [ObjectNames.TivaraWorkerMale],
      price: { food: 50 },
      durationMs: 5000,
      refundFactor: 0.5
    },
    research: {
      type: ResearchType.TivaraSlingshotUpgradeLevel2,
      price: { minerals: 200, wood: 150 },
      durationMs: 40000,
      refundFactor: 0.5
    },
    replacement: {
      type: ResearchType.TivaraMacemanUpgradeLevel2,
      price: { minerals: 175 },
      durationMs: 30000,
      refundFactor: 0.5
    },
    refundBudget: { food: 0, wood: 73, stone: 0, minerals: 97 }
  });
  const sent: GameCommand[] = [];
  const roles = branch === "shared_contention" ? ["train", "research"] : ["purchase", "probe", "cancel", "resume"];
  const dispatch = jest.fn((input: GameCommandInput) => {
    const sequence = sent.length;
    const role = requireAiTestEntry(roles, sequence);
    const command = {
      ...input,
      tick: ticks.currentTick + 2,
      execution: {
        schemaVersion: 1,
        commandId: role,
        commitmentKey: role,
        source: "human",
        authorityEpoch: 0,
        sequence
      }
    } satisfies GameCommand;
    sent.push(command);
    return { status: "dispatched", command } as const;
  });
  const bus = { commandOutcome$: outcomes, command$: commands, dispatch } as unknown as CommandBusService;
  const world = new AiMultiplayerSharedQueueWorld(scene, bus, branch);
  const step = (tick: number) => {
    ticks.currentTick = tick;
    ticks.tick$.next(tick);
  };
  const report = (commandId: string, kind: GameCommandOutcome["kind"], tick: number, worldLinkIds: string[] = []) => {
    ticks.currentTick = tick;
    outcomes.next({
      schemaVersion: 1,
      kind,
      reason: kind === "rejected" ? "insufficient_resources" : "applied",
      tick,
      playerNumber: 1,
      commandId,
      commitmentKey: commandId,
      authorityEpoch: 0,
      sequence: roles.indexOf(commandId),
      actorIds: ["producer"],
      worldLinkIds
    });
  };
  return {
    world,
    dispatch,
    sent,
    capture,
    ticks,
    commands,
    outcomes,
    step,
    report,
    registerEffects: () => {
      indexed = true;
      researched = true;
    },
    loseEffect: () => {
      indexed = false;
      researched = false;
    }
  };
}

describe("distinct shared queue worlds (mocked scheduling, no runtime/network acceptance)", () => {
  it("shares one future batch for contention, waits for both independent authority effects and stable presence", () => {
    const f = fixture("shared_contention");
    f.step(1);
    f.world.start();
    expect(f.sent.map((command) => command.tick)).toEqual([3, 3]);
    f.report("train", "applied", 3);
    f.report("research", "applied", 3);
    expect(f.world.getSnapshot().checkpoints.at(-1)?.boundary).toBe("contending");
    f.report("train", "completed", 103, ["new-worker"]);
    f.report("research", "completed", 903, [`research:${ResearchType.TivaraSlingshotUpgradeLevel2}`]);
    f.step(904);
    expect(f.world.getSnapshot().state).toBe("running");
    f.registerEffects();
    f.step(905);
    expect(f.world.getSnapshot().state).toBe("stabilizing");
    f.step(924);
    expect(f.world.getSnapshot().state).toBe("stabilizing");
    f.step(925);
    expect(f.world.getSnapshot().state).toBe("complete");
    f.world.destroy();
  });

  it("cancels the paid technology while a different research probe is pending, never requeues the cancelled product", () => {
    const f = fixture("cancel_research");
    f.step(1);
    f.world.start();
    f.report("purchase", "applied", 3);
    f.step(4);
    f.step(5);
    expect(requireAiTestEntry(f.sent, 1)).toMatchObject({
      type: "RESEARCH",
      researchType: ResearchType.TivaraMacemanUpgradeLevel2,
      tick: 6
    });
    expect(requireAiTestEntry(f.sent, 2)).toMatchObject({ type: "CANCEL_RESEARCH", tick: 7 });
    f.report("probe", "rejected", 6);
    f.report("purchase", "cancelled", 7);
    expect(f.world.getSnapshot().state).toBe("rejected");
    f.report("cancel", "cancelled", 7);
    f.step(8);
    expect(requireAiTestEntry(f.sent, 3)).toMatchObject({
      type: "RESEARCH",
      researchType: ResearchType.TivaraMacemanUpgradeLevel2
    });
    expect(
      f.sent.filter(
        (command) => command.type === "RESEARCH" && command.researchType === ResearchType.TivaraSlingshotUpgradeLevel2
      )
    ).toHaveLength(1);
    f.world.destroy();
  });

  it("keeps remote peers and polling passive, and disposes each subscription exactly once", () => {
    const f = fixture("cancel_research", 2);
    f.step(1);
    f.report("purchase", "applied", 3);
    f.step(4);
    f.step(5);
    const count = f.capture.captureHumanQueueBoundary.mock.calls.length;
    f.world.getSnapshot();
    f.world.getSnapshot();
    expect(f.capture.captureHumanQueueBoundary).toHaveBeenCalledTimes(count);
    expect(f.dispatch).not.toHaveBeenCalled();
    expect(f.world.getSnapshot().requests).toEqual([]);
    expect(() => f.world.start()).toThrow("shared_queue_world_sender_not_ready");
    f.world.destroy();
    f.world.destroy();
    expect(f.capture.dispose).toHaveBeenCalledTimes(1);
    expect([f.commands.observed, f.outcomes.observed, f.ticks.tick$.observed]).toEqual([false, false, false]);
  });

  it("fails closed when the clock skips the genuine pending cancellation boundary", () => {
    const f = fixture("cancel_research");
    f.step(1);
    f.world.start();
    f.report("purchase", "applied", 3);
    f.step(4);
    f.step(6);
    expect(f.world.getSnapshot()).toMatchObject({
      state: "failed",
      failure: "shared_queue_probe_applied_before_request"
    });
    expect(f.dispatch).toHaveBeenCalledTimes(2);
    f.world.destroy();
  });

  it("fails if registered effects disappear during the required stability window", () => {
    const f = fixture("shared_contention");
    f.step(1);
    f.world.start();
    f.report("train", "applied", 3);
    f.report("research", "applied", 3);
    f.report("train", "completed", 103, ["new-worker"]);
    f.report("research", "completed", 903, [`research:${ResearchType.TivaraSlingshotUpgradeLevel2}`]);
    f.registerEffects();
    f.step(904);
    f.loseEffect();
    f.step(905);
    expect(f.world.getSnapshot()).toMatchObject({
      state: "failed",
      failure: "shared_queue_world_effect_lost_during_stability"
    });
    f.world.destroy();
  });
});
