import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getSceneService, getSceneSystem } from "../scene-component-helpers";
import { CommandBusService } from "../multiplayer/command-bus.service";
import { SimulationTickService } from "../simulation-tick.service";
import { StateHashProjection } from "./state-hash-projection";

jest.mock("../scene-component-helpers", () => ({ getSceneService: jest.fn(), getSceneSystem: jest.fn() }));

it("compares current live controller/authority state rather than the last saved copies", () => {
  const stale = { marker: "last-save" }, live = { marker: "current-boundary" };
  const authority = { authorityEpoch: 4, nextSequence: 17 };
  const scene = { players: [{ playerNumber: 2, playerState: { data: { aiBehaviorTreeState: stale } } }],
    baseGameData: { gameInstance: { gameState: { data: { commandAuthority: stale, simulationTick: 1 } } } }
  } as unknown as ProbableWaffleScene;
  (getSceneSystem as jest.Mock).mockReturnValue({ getAiPlayerController: () => ({ getSaveState: () => live }) });
  (getSceneService as jest.Mock).mockImplementation((_scene, token) => token === CommandBusService
    ? { getAuthorityState: () => authority } : token === SimulationTickService ? { currentTick: 1999 } : undefined);
  const result = new StateHashProjection().captureAuthoritativeProjection(scene);
  expect(JSON.parse(result.systems.aiControllers)).toEqual({ "2": live });
  expect(JSON.parse(result.systems.commandAuthority)).toEqual(authority);
  expect(result.systems.simulationTick).toBe("1999");
  expect(scene.players[0].playerState.data.aiBehaviorTreeState).toBe(stale);
});

it("ignores measured telemetry while retaining recovery age, retry debt, cadence and authority state", () => {
  const live = { blackboard: { cooldowns: { build: 400 } }, brainState: {
    scheduler: { decisionSequence: 7 }, recovery: { records: [{ enteredTick: 80, nextRetryTick: 500, attempt: 2 }] } },
    controllerCadence: { schemaVersion: 1, elapsedMilliseconds: 950, queuedAfterBoundary: false, completedDecisionSequence: 7 },
    telemetry: { spans: { preTick: { avg: 1, last: 2, count: 7 } }, events: [{ t: 100 }] } };
  const authority = { authorityEpoch: 4, nextSequence: 17 };
  const scene = { players: [{ playerNumber: 2, playerState: { data: {} } }],
    baseGameData: { gameInstance: { gameState: { data: {} } } }
  } as unknown as ProbableWaffleScene;
  (getSceneSystem as jest.Mock).mockReturnValue({ getAiPlayerController: () => ({ getSaveState: () => live }) });
  (getSceneService as jest.Mock).mockImplementation((_scene, token) => token === CommandBusService
    ? { getAuthorityState: () => authority } : token === SimulationTickService ? { currentTick: 1999 } : undefined);
  const capture = () => new StateHashProjection().captureAuthoritativeProjection(scene).systems;
  const original = capture();
  live.telemetry.spans.preTick.last = 9876;
  live.telemetry.events[0].t = 50000;
  expect(capture()).toEqual(original);
  expect(live.telemetry.spans.preTick.last).toBe(9876);
  live.brainState.recovery.records[0].nextRetryTick++;
  expect(capture().aiControllers).not.toBe(original.aiControllers);
  live.brainState.recovery.records[0].nextRetryTick--;
  live.controllerCadence.elapsedMilliseconds++;
  expect(capture().aiControllers).not.toBe(original.aiControllers);
  authority.authorityEpoch++;
  expect(capture().commandAuthority).not.toBe(original.commandAuthority);
});
