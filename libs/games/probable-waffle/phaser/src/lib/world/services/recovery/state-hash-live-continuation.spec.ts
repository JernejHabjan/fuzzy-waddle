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
