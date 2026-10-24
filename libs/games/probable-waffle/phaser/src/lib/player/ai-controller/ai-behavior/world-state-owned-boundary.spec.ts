import type Phaser from "phaser";
import { FactionType, ResourceType, type ProbableWafflePlayer } from "@fuzzy-waddle/probable-waffle-protocol";
import { WorldStateSnapshotManager } from "./world-state-snapshot-manager";
import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";

jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

it("refreshes authoritative owned resources and supply without starting a legacy enemy query", () => {
  const resources = {
    [ResourceType.Food]: 321,
    [ResourceType.Wood]: 123,
    [ResourceType.Stone]: 80,
    [ResourceType.Minerals]: 60
  };
  const player = {
    factionType: FactionType.Tivara,
    playerNumber: 1,
    getResources: () => resources,
    playerState: { data: { housing: { maxHousing: 10, currentHousing: 3 } } }
  } as unknown as ProbableWafflePlayer;
  const blackboard = { economy: { resources: {} }, production: { supply: {} } } as unknown as PlayerAiBlackboard;
  const index = { getOwnedActors: () => [] };
  jest
    .mocked(getSceneService)
    .mockImplementation((_scene, token) => (token === ActorIndexSystem ? (index as never) : undefined));
  const manager = new WorldStateSnapshotManager({} as Phaser.Scene, player, blackboard);
  const enemyQuery = jest.fn(() => new Promise<void>(() => undefined));
  Reflect.set(manager, "refreshEnemyState", enemyQuery);
  manager.updateOwned(10000);
  expect(blackboard.economy.resources).toBe(resources);
  expect(blackboard.production.supply).toMatchObject({ max: 10, used: 3, pendingFromQueued: 0 });
  expect(enemyQuery).not.toHaveBeenCalled();
  jest.resetAllMocks();
});
