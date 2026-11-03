import type Phaser from "phaser";
import { BehaviourTree, State } from "mistreevous";
import { PawnAgentMovement } from "../../../prefabs/ai-agents/actions/pawn-agent-movement";
import { PlayerPawnAiControllerMdsl } from "../../../prefabs/ai-agents/behaviors/player-pawn-ai-controller.mdsl";
import { isWithinAttackRange } from "./attack-range";
import { getGameObjectCurrentTile, isGameObjectActiveInActiveScene } from "../../../data/game-object-helper";
import { getActorComponent } from "../../../data/actor-component";
import { getSceneComponent } from "../../../world/services/scene-component-helpers";
import { getTileCoordsUnderObject } from "../../../library/tile-under-object";
import { DistanceHelper } from "../../../library/distance-helper";
import { getHighGroundRangeBonus } from "./high-ground.helper";
import { FlyingComponent } from "../movement/flying-component";
import { AttackComponent } from "./components/attack-component";
import { HealthComponent } from "./components/health-component";
import { PawnAgentCombat } from "../../../prefabs/ai-agents/actions/pawn-agent-combat";
import { PawnAiBlackboard } from "../../../prefabs/ai-agents/controller/pawn-ai-blackboard";
import { OrderData } from "../../../ai/OrderData";
import { OrderType } from "../../../ai/order-type";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({
  getGameObjectCurrentTile: jest.fn(),
  isGameObjectActiveInActiveScene: jest.fn()
}));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneComponent: jest.fn() }));
jest.mock("../../../library/tile-under-object", () => ({ getTileCoordsUnderObject: jest.fn() }));
jest.mock("./high-ground.helper", () => ({ getHighGroundRangeBonus: jest.fn() }));

const attacker = { scene: {} } as Phaser.GameObjects.GameObject;
const target = { scene: {} } as Phaser.GameObjects.GameObject;
const weapon = { range: 6, minRange: 2, canTargetAir: true };

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(isGameObjectActiveInActiveScene).mockReturnValue(true);
  jest
    .mocked(getGameObjectCurrentTile)
    .mockImplementation((actor) => (actor === attacker ? { x: 0, y: 0 } : { x: 5, y: 0 }));
  jest.mocked(getSceneComponent).mockReturnValue({ tilemap: {} } as never);
  jest.mocked(getTileCoordsUnderObject).mockReturnValue([]);
  jest.mocked(getHighGroundRangeBonus).mockReturnValue(0);
  jest.spyOn(DistanceHelper, "getFlyingHeightInTiles").mockReturnValue(0);
});
afterEach(() => jest.restoreAllMocks());

it("admits a physical range without requiring a walkable route, and rejects a distant target", () => {
  expect(isWithinAttackRange(attacker, target, weapon)).toBe(true);
  jest
    .mocked(getGameObjectCurrentTile)
    .mockImplementation((actor) => (actor === attacker ? { x: 0, y: 0 } : { x: 10, y: 0 }));
  expect(isWithinAttackRange(attacker, target, weapon)).toBe(false);
});

it("uses the occupied edge of a ground structure rather than its distant center", () => {
  jest
    .mocked(getGameObjectCurrentTile)
    .mockImplementation((actor) => (actor === attacker ? { x: 0, y: 0 } : { x: 10, y: 0 }));
  jest.mocked(getTileCoordsUnderObject).mockReturnValue([
    { x: 6, y: 0 },
    { x: 7, y: 0 }
  ]);
  expect(isWithinAttackRange(attacker, target, weapon)).toBe(true);
});

it("respects minimum range and the existing whole-tile boundary", () => {
  jest
    .mocked(getGameObjectCurrentTile)
    .mockImplementation((actor) => (actor === attacker ? { x: 0, y: 0 } : { x: 1, y: 0 }));
  expect(isWithinAttackRange(attacker, target, weapon)).toBe(false);
  jest
    .mocked(getGameObjectCurrentTile)
    .mockImplementation((actor) => (actor === attacker ? { x: 0, y: 0 } : { x: 6, y: 1 }));
  expect(isWithinAttackRange(attacker, target, weapon)).toBe(true);
});

it("counts flight height once and rejects a weapon that cannot target air", () => {
  jest
    .mocked(getActorComponent)
    .mockImplementation((actor, token) => (actor === target && token === FlyingComponent ? ({} as never) : undefined));
  jest
    .mocked(getGameObjectCurrentTile)
    .mockImplementation((actor) => (actor === attacker ? { x: 0, y: 0 } : { x: 6, y: 0 }));
  jest.spyOn(DistanceHelper, "getFlyingHeightInTiles").mockImplementation((actor) => (actor === target ? 4 : 0));
  expect(isWithinAttackRange(attacker, target, weapon)).toBe(false);
  jest
    .mocked(getGameObjectCurrentTile)
    .mockImplementation((actor) => (actor === attacker ? { x: 0, y: 0 } : { x: 4, y: 0 }));
  expect(isWithinAttackRange(attacker, target, weapon)).toBe(true);
  expect(isWithinAttackRange(attacker, target, { ...weapon, canTargetAir: false })).toBe(false);
  expect(getTileCoordsUnderObject).not.toHaveBeenCalled();
});

it("applies the native high-ground bonus", () => {
  jest
    .mocked(getGameObjectCurrentTile)
    .mockImplementation((actor) => (actor === attacker ? { x: 0, y: 0 } : { x: 8, y: 0 }));
  jest.mocked(getHighGroundRangeBonus).mockReturnValue(2);
  expect(isWithinAttackRange(attacker, target, weapon)).toBe(true);
});

it("does not query disposed scenes or actors without a known tile", () => {
  jest.mocked(isGameObjectActiveInActiveScene).mockReturnValue(false);
  expect(isWithinAttackRange(attacker, target, weapon)).toBe(false);
  expect(getGameObjectCurrentTile).not.toHaveBeenCalled();
  jest.mocked(isGameObjectActiveInActiveScene).mockReturnValue(true);
  jest.mocked(getGameObjectCurrentTile).mockReturnValue(undefined);
  expect(isWithinAttackRange(attacker, target, weapon)).toBe(false);
});

it("rechecks physical range at pawn attack admission after a target moves away", () => {
  const useAttack = jest.fn();
  const component = { getAttack: () => weapon, remainingCooldown: 0, useAttack };
  jest
    .mocked(getActorComponent)
    .mockImplementation((actor, token) =>
      token === AttackComponent && actor === attacker
        ? (component as never)
        : token === HealthComponent
          ? ({ alive: true } as never)
          : undefined
    );
  const board = new PawnAiBlackboard();
  board.setCurrentOrder(new OrderData(OrderType.Attack, { targetGameObject: target }));
  const combat = new PawnAgentCombat(attacker, board, { SelfIsAlive: () => true });
  expect(combat.Attack()).toBe(State.SUCCEEDED);
  jest
    .mocked(getGameObjectCurrentTile)
    .mockImplementation((actor) => (actor === attacker ? { x: 0, y: 0 } : { x: 10, y: 0 }));
  expect(combat.Attack()).toBe(State.FAILED);
  expect(useAttack).toHaveBeenCalledTimes(1);
});

it("checks range and starts a ready attack in one behavior update instead of yielding to a moving target", () => {
  const useAttack = jest.fn();
  const component = { getAttack: () => weapon, remainingCooldown: 0, useAttack };
  jest
    .mocked(getActorComponent)
    .mockImplementation((actor, token) =>
      token === AttackComponent && actor === attacker
        ? (component as never)
        : token === HealthComponent
          ? ({ alive: true } as never)
          : undefined
    );
  const board = new PawnAiBlackboard();
  board.setCurrentOrder(new OrderData(OrderType.Attack, { targetGameObject: target }));
  const combat = new PawnAgentCombat(attacker, board, { SelfIsAlive: () => true });
  const movement = new PawnAgentMovement(
    attacker,
    board,
    {
      Stop: () => State.SUCCEEDED,
      MoveToTarget: async () => State.FAILED,
      MoveToLocation: async () => State.FAILED
    },
    () => null
  );
  const agent = {
    PlayerOrderIs: () => true,
    TargetOrLocationExists: () => true,
    HasAttackComponent: () => true,
    TargetExists: () => true,
    TargetIsAlive: () => true,
    SelfIsAlive: () => true,
    CanAttackCurrentTarget: () => true,
    LeaveConstructionSiteOrCurrentContainer: () => State.SUCCEEDED,
    CooldownReady: () => true,
    InRange: () => {
      const result = movement.InRange("attack");
      // Normalize native async promises across the Jest Zone boundary; browsers use one promise realm.
      return typeof result === "string" ? result : Promise.resolve(result);
    },
    MoveToTargetOrLocation: jest.fn(async () => State.SUCCEEDED),
    Stop: jest.fn(() => State.SUCCEEDED),
    Attack: combat.Attack.bind(combat)
  };
  const branch = PlayerPawnAiControllerMdsl.slice(
    PlayerPawnAiControllerMdsl.indexOf("root [Attack]"),
    PlayerPawnAiControllerMdsl.indexOf("root [Move]")
  );
  const tree = new BehaviourTree(`root { branch [Attack] }\n${branch}`, agent);
  tree.step();
  expect(useAttack).toHaveBeenCalledTimes(1);
  expect(agent.MoveToTargetOrLocation).not.toHaveBeenCalled();
});
