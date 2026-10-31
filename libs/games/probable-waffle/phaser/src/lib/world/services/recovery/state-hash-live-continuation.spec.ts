import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getSceneService, getSceneSystem } from "../scene-component-helpers";
import { CommandBusService } from "../multiplayer/command-bus.service";
import { SimulationTickService } from "../simulation-tick.service";
import { ActorIndexSystem } from "../ActorIndexSystem";
import { StateHashProjection } from "./state-hash-projection";

jest.mock("../scene-component-helpers", () => ({ getSceneService: jest.fn(), getSceneSystem: jest.fn() }));

it("compares current live controller/authority state rather than the last saved copies", () => {
  const stale = { marker: "last-save" },
    live = { marker: "current-boundary" };
  const authority = { authorityEpoch: 4, nextSequence: 17 };
  const scene = {
    players: [{ playerNumber: 2, playerState: { data: { aiBehaviorTreeState: stale } } }],
    baseGameData: { gameInstance: { gameState: { data: { commandAuthority: stale, simulationTick: 1 } } } }
  } as unknown as ProbableWaffleScene;
  (getSceneSystem as jest.Mock).mockReturnValue({ getAiPlayerController: () => ({ getSaveState: () => live }) });
  (getSceneService as jest.Mock).mockImplementation((_scene, token) =>
    token === CommandBusService
      ? { getAuthorityState: () => authority }
      : token === SimulationTickService
        ? { currentTick: 1999 }
        : undefined
  );
  const result = new StateHashProjection().captureAuthoritativeProjection(scene);
  expect(result.systems.aiControllers).toBe("{2:{marker:current-boundary}}");
  expect(result.systems.commandAuthority).toBe("{authorityEpoch:4,nextSequence:17}");
  expect(result.systems.simulationTick).toBe("1999");
  expect(requireAiTestEntry(scene.players, 0).playerState.data.aiBehaviorTreeState).toBe(stale);
});

it("ignores measured telemetry while retaining recovery age, retry debt, cadence and authority state", () => {
  const live = {
    blackboard: { cooldowns: { build: 400 } },
    brainState: {
      scheduler: { decisionSequence: 7 },
      recovery: { records: [{ enteredTick: 80, nextRetryTick: 500, attempt: 2 }] }
    },
    controllerCadence: {
      schemaVersion: 1,
      elapsedMilliseconds: 950,
      queuedAfterBoundary: false,
      completedDecisionSequence: 7
    },
    telemetry: { spans: { preTick: { avg: 1, last: 2, count: 7 } }, events: [{ t: 100 }] }
  };
  const authority = { authorityEpoch: 4, nextSequence: 17 };
  const scene = {
    players: [{ playerNumber: 2, playerState: { data: { resources: {} } } }],
    baseGameData: { gameInstance: { gameState: { data: {} } } }
  } as unknown as ProbableWaffleScene;
  (getSceneSystem as jest.Mock).mockReturnValue({ getAiPlayerController: () => ({ getSaveState: () => live }) });
  (getSceneService as jest.Mock).mockImplementation((_scene, token) =>
    token === CommandBusService
      ? { getAuthorityState: () => authority }
      : token === SimulationTickService
        ? { currentTick: 1999 }
        : undefined
  );
  const capture = () => new StateHashProjection().captureAuthoritativeProjection(scene).systems;
  const original = capture();
  live.telemetry.spans.preTick.last = 9876;
  requireAiTestEntry(live.telemetry.events, 0).t = 50000;
  expect(capture()).toEqual(original);
  expect(live.telemetry.spans.preTick.last).toBe(9876);
  requireAiTestEntry(live.brainState.recovery.records, 0).nextRetryTick++;
  expect(capture().aiControllers).not.toBe(original.aiControllers);
  requireAiTestEntry(live.brainState.recovery.records, 0).nextRetryTick--;
  live.controllerCadence.elapsedMilliseconds++;
  expect(capture().aiControllers).not.toBe(original.aiControllers);
  authority.authorityEpoch++;
  expect(capture().commandAuthority).not.toBe(original.commandAuthority);
});

it("includes food in full native continuation even though the legacy multiplayer player projection omits it", () => {
  const resources = { food: 100, wood: 200, stone: 50, minerals: 10 };
  const scene = {
    players: [{ playerNumber: 2, playerState: { data: { resources } } }],
    baseGameData: { gameInstance: { gameState: { data: {} } } }
  } as unknown as ProbableWaffleScene;
  (getSceneSystem as jest.Mock).mockReturnValue(undefined);
  (getSceneService as jest.Mock).mockImplementation((_scene, token) =>
    token === ActorIndexSystem ? { getAllIdActors: () => [] } : undefined
  );
  const original = new StateHashProjection().captureAuthoritativeProjection(scene);
  resources.food--;
  const changed = new StateHashProjection().captureAuthoritativeProjection(scene);
  expect(changed.systems.playerResources).not.toBe(original.systems.playerResources);
  expect(changed.players).toEqual(original.players);
});

it("hashes JSON-omitted optional state the same before and after native save/restore", () => {
  const aiState = { brainState: { scheduler: { decisionSequence: 3, optionalQueue: undefined } } };
  const authority = { authorityEpoch: 2, optionalReceipt: undefined };
  const scene = {
    players: [{ playerNumber: 2, playerState: { data: { resources: {} } } }],
    baseGameData: { gameInstance: { gameState: { data: {} } } }
  } as unknown as ProbableWaffleScene;
  (getSceneSystem as jest.Mock).mockReturnValue({ getAiPlayerController: () => ({ getSaveState: () => aiState }) });
  (getSceneService as jest.Mock).mockImplementation((_scene, token) =>
    token === CommandBusService
      ? { getAuthorityState: () => authority }
      : token === ActorIndexSystem
        ? { getAllIdActors: () => [] }
        : undefined
  );
  const before = new StateHashProjection().captureAuthoritativeProjection(scene);
  delete (aiState.brainState.scheduler as { optionalQueue?: undefined }).optionalQueue;
  delete (authority as { optionalReceipt?: undefined }).optionalReceipt;
  const after = new StateHashProjection().captureAuthoritativeProjection(scene);
  expect(after.systems).toEqual(before.systems);
});
