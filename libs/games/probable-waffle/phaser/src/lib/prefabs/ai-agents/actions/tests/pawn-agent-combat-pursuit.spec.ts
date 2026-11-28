import Phaser from "phaser";
import { State } from "mistreevous";
import { getActorComponent } from "../../../../data/actor-component";
import * as gameObjectHelpers from "../../../../data/game-object-helper";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { HealthComponent } from "../../../../entity/components/combat/components/health-component";
import { OwnerComponent } from "../../../../entity/components/owner-component";
import { VisionComponent } from "../../../../entity/components/vision-component";
import { PawnAiBlackboard, RELEASED_PURSUIT_TARGET_MEMORY_KEY } from "../../controller/pawn-ai-blackboard";
import { PawnAgentCombat } from "../pawn-agent-combat";
import { ProbableWafflePlayerType } from "@fuzzy-waddle/probable-waffle-protocol";

jest.mock("../../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../../data/game-object-helper", () => ({ getGameObjectCurrentTile: jest.fn() }));

function fixture(playerType: ProbableWafflePlayerType) {
  const scene = {
    sys: { queueDepthSort: jest.fn() },
    players: [{ playerNumber: 2, playerController: { data: { playerDefinition: { playerType } } } }]
  } as unknown as Phaser.Scene;
  const pawn = new Phaser.GameObjects.GameObject(scene, "pawn");
  const enemy = new Phaser.GameObjects.GameObject(scene, "enemy");
  const vision = { getVisibleEnemies: () => [enemy] };
  const owner = { getOwner: () => 2 };
  jest.mocked(getActorComponent).mockImplementation((actor, token) => {
    if (actor === pawn && token === OwnerComponent) return owner as never;
    if (actor === pawn && token === VisionComponent) return vision as never;
    if (actor === pawn && token === HealthComponent) return { latestDamage: { damageInitiator: enemy } } as never;
    if (actor === enemy && token === IdComponent) return { id: "enemy-1" } as never;
    return undefined;
  });
  jest.spyOn(gameObjectHelpers, "getGameObjectCurrentTile").mockReturnValue({ x: 7, y: 8 });
  const blackboard = new PawnAiBlackboard();
  const combat = new PawnAgentCombat(pawn, blackboard, { SelfIsAlive: () => true });
  jest
    .spyOn(combat as unknown as { canAttackTarget(target: Phaser.GameObjects.GameObject): boolean }, "canAttackTarget")
    .mockReturnValue(true);
  return { pawn, enemy, blackboard, combat };
}

describe("pawn AI pursuit selection", () => {
  beforeEach(() => jest.resetAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("anchors an autonomous AI vision acquisition at the target's observed tile", () => {
    const f = fixture(ProbableWafflePlayerType.AI);

    expect(f.combat.AssignEnemy("vision")).toBe(State.SUCCEEDED);
    expect(f.blackboard.getQueuedOrders()[0]?.data).toMatchObject({
      targetGameObject: f.enemy,
      targetGameObjectId: "enemy-1",
      pursuitTargetOrigin: { x: 7, y: 8, z: 0 }
    });
  });

  it("does not add an AI leash to local human-unit self defense", () => {
    const f = fixture(ProbableWafflePlayerType.Human);

    expect(f.combat.AssignEnemy("vision")).toBe(State.SUCCEEDED);
    expect(f.blackboard.getQueuedOrders()[0]?.data).toMatchObject({ targetGameObject: f.enemy });
    expect(f.blackboard.getQueuedOrders()[0]?.data.pursuitTargetOrigin).toBeUndefined();
  });

  it("keeps a released visible target out of the pawn's local reacquisition choice", () => {
    const f = fixture(ProbableWafflePlayerType.AI);
    f.blackboard.remember(RELEASED_PURSUIT_TARGET_MEMORY_KEY, "enemy-1");

    expect(f.combat.getClosestAttackableVisibleEnemy()).toBeNull();
  });

  it("does not restart an AI chase through retaliation against a released target", () => {
    const f = fixture(ProbableWafflePlayerType.AI);
    f.blackboard.remember(RELEASED_PURSUIT_TARGET_MEMORY_KEY, "enemy-1");

    expect(f.combat.AssignEnemy("retaliation")).toBe(State.FAILED);
    expect(f.blackboard.getQueuedOrders()).toEqual([]);
  });

  it("leaves human retaliation outside the AI pursuit policy", () => {
    const f = fixture(ProbableWafflePlayerType.Human);

    expect(f.combat.AssignEnemy("retaliation")).toBe(State.SUCCEEDED);
    expect(f.blackboard.getQueuedOrders()[0]?.data.pursuitTargetOrigin).toBeUndefined();
  });
});
