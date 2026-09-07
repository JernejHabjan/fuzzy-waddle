import {
  ProbableWaffleGameCommandTypes,
  ProbableWafflePlayerType,
  type AIBehaviorTreeStateData,
  type GameCommandAuthorityState
} from "@fuzzy-waddle/probable-waffle-protocol";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { runAiRuntimeScenarioV1, type AiRuntimeScenarioBridgePortV1 } from "./ai-runtime-scenario-driver";
import type { AiRuntimeScenarioBoundaryV1 } from "./ai-runtime-scenario-bridge";

const controllerState = { blackboard: {} } as AIBehaviorTreeStateData;

describe("Stage 5 real runtime scenario bootstrap", () => {
  it("restores the captured controller boundary before continuing later checkpoints", async () => {
    const restored: number[] = [];
    const bridge: AiRuntimeScenarioBridgePortV1 = {
      advanceToCommittedObservation: async (_playerNumber, tick): Promise<AiRuntimeScenarioBoundaryV1> => ({
        tick,
        observationDigest: `observation:${tick}`,
        worldDigest: `world:${tick}`,
        controllerState,
        authorityEpoch: 1,
        outcomeCount: tick
      }),
      restoreControllerBoundary: (_playerNumber, state) => restored.push(state === controllerState ? -1 : 20)
    };
    const boundaries = await runAiRuntimeScenarioV1(bridge, {
      scenarioId: "DBG-01",
      playerNumber: 1,
      checkpointTicks: [20, 40],
      saveContinuationAfterTick: 20
    });
    expect(boundaries.map((boundary) => boundary.tick)).toEqual([20, 40]);
    expect(restored).toEqual([20]);
  });

  it("applies a shared command once and preserves its dedup frontier over save continuation", () => {
    const firstScene = createAuthorityScene();
    const firstBus = new CommandBusService(firstScene);
    firstScene.getSceneGameData().services.push(firstBus);
    firstBus.command$.subscribe((command) => firstBus.reportOutcome(command, "completed", "applied"));
    const receipt = firstBus.dispatchDeterministic({
      type: ProbableWaffleGameCommandTypes.Concede,
      playerNumber: 1,
      actorIds: [],
      reason: "fixture",
      execution: {
        schemaVersion: 1,
        commandId: "1:0:7:stage-5",
        commitmentKey: "fixture:concede",
        source: "ai",
        authorityEpoch: 0,
        sequence: 7,
        intentId: "intent:fixture",
        effectId: "effect:fixture"
      }
    });
    expect(receipt.status).toBe("dispatched");
    if (receipt.status !== "dispatched") return;
    const savedAuthority = firstBus.getAuthorityState();

    const restoredScene = createAuthorityScene(savedAuthority);
    const restoredBus = new CommandBusService(restoredScene);
    restoredScene.getSceneGameData().services.push(restoredBus);
    restoredBus.playReplayBatch({ tick: receipt.command.tick, playerNumber: 1, commands: [receipt.command] });

    const outcomes = restoredBus.getAuthorityState().outcomes.filter((outcome) => outcome.commandId === "1:0:7:stage-5");
    expect(outcomes.filter((outcome) => outcome.kind === "completed")).toHaveLength(1);
    expect(outcomes.at(-1)?.reason).toBe("duplicate_command");
  });
});

function createAuthorityScene(commandAuthority?: GameCommandAuthorityState): ProbableWaffleScene {
  const services: unknown[] = [];
  return Object.assign(Object.create(ProbableWaffleScene.prototype), {
    events: { once: jest.fn() },
    baseGameData: {
      user: { userId: "host" },
      gameInstance: {
        isHost: () => true,
        isSpectator: () => false,
        players: [
          {
            playerNumber: 1,
            playerController: { data: { playerDefinition: { playerType: ProbableWafflePlayerType.AI } } }
          }
        ],
        gameInstanceMetadata: { data: { gameInstanceId: "stage-5-runtime" }, isReplay: () => false },
        gameState: { data: { commandAuthority } }
      }
    },
    getSceneGameData: () => ({ services, systems: [], components: [], initializers: {}, baseGameData: {} })
  }) as ProbableWaffleScene;
}
