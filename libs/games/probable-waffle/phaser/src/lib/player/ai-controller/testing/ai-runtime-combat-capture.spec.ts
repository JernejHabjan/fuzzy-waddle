import type Phaser from "phaser";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { AttackComponent } from "../../../entity/components/combat/components/attack-component";
import { weaponDefinitions } from "../../../entity/components/combat/weapon-definitions";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import { AiRuntimeCombatCapture } from "./ai-runtime-combat-capture";
import type { AiRuntimeCombatOperationV1 } from "./ai-runtime-combat-operation-v1";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ getGameObjectCurrentTile: () => ({ x: 10, y: 10 }) }));
jest.mock("../../../data/scene-data", () => ({ isSnapshotApplyInProgress: () => false }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../library/distance-helper", () => ({ DistanceHelper: { getTileDistanceBetweenGameObjects: () => 1 } }));
jest.mock("../../../entity/components/combat/high-ground.helper", () => ({ getHighGroundRangeBonus: () => 0 }));
jest.mock("./capture-ai-runtime-created-actor", () => ({ captureAiRuntimeCreatedActor: jest.fn() }));

/** Synthetic call-through authorities exercise observer behavior; they do not prove real native combat or timing. */
function fixture() {
  const scene = { sys: { isActive: () => true } } as unknown as ProbableWaffleScene;
  const source = { name: "source", scene } as unknown as Phaser.GameObjects.GameObject;
  const target = { name: "target", scene } as unknown as Phaser.GameObjects.GameObject;
  const attack = {
    remainingCooldown: 0, getAttack: jest.fn(() => weaponDefinitions.BowTower),
    useAttack: jest.fn((_target: Phaser.GameObjects.GameObject) => { attack.remainingCooldown = 1000; return "native-return"; })
  };
  jest.mocked(getActorComponent).mockImplementation((actor, component) =>
    (actor === source && component === AttackComponent ? attack : undefined) as never);
  jest.mocked(getSceneService).mockReturnValue({ currentTick: 20 } as never);
  jest.mocked(captureAiRuntimeCreatedActor).mockImplementation((actor) => ({
    actorId: actor.name, objectName: actor.name, canonicalObjectName: ObjectNames.TivaraMacemanMale,
    playerNumber: actor === source ? 2 : 1, active: true, alive: true, finished: true, indexed: true
  }));
  const operations: AiRuntimeCombatOperationV1[] = [], lose = jest.fn();
  const append = jest.fn((_owner: number, operation: AiRuntimeCombatOperationV1) => operations.push(operation));
  const capture = new AiRuntimeCombatCapture(scene, append, lose);
  return { source, target, attack, operations, lose, append, capture };
}

describe("explicit native combat observer", () => {
  beforeEach(() => jest.clearAllMocks());

  it("installs once, preserves native return values and fences retained wrappers after disposal", () => {
    const f = fixture(), original = f.attack.useAttack;
    f.capture.watch(f.source);
    f.capture.watch(f.source);
    const retained = f.attack.useAttack;
    expect(f.attack.useAttack(f.target)).toBe("native-return");
    expect(original).toHaveBeenCalledTimes(1);
    expect(f.operations.map((operation) => operation.kind)).toEqual(["attack_requested", "attack_committed"]);
    f.capture.dispose();
    f.capture.dispose();
    expect(f.attack.useAttack).toBe(original);
    f.attack.remainingCooldown = 0;
    expect(retained(f.target)).toBe("native-return");
    expect(f.operations).toHaveLength(2);
  });

  it("does not replace another owner's later hook during cleanup", () => {
    const f = fixture();
    f.capture.watch(f.source);
    const later = jest.fn((_target: Phaser.GameObjects.GameObject) => "later-owner");
    f.attack.useAttack = later;
    f.capture.dispose();
    expect(f.attack.useAttack).toBe(later);
  });

  it("fences a retained actor wrapper after unwatch while the root capture remains active", () => {
    const f = fixture(), original = f.attack.useAttack;
    f.capture.watch(f.source);
    const retained = f.attack.useAttack;
    f.capture.unwatch(f.source);
    expect(f.attack.useAttack).toBe(original);
    expect(retained(f.target)).toBe("native-return");
    expect(f.operations).toHaveLength(0);
    f.capture.dispose();
  });

  it("cannot suppress an actual attack when the diagnostic append fails", () => {
    const f = fixture(), original = f.attack.useAttack;
    f.append.mockImplementation(() => { throw new Error("diagnostic-only failure"); });
    f.capture.watch(f.source);
    expect(f.attack.useAttack(f.target)).toBe("native-return");
    expect(original).toHaveBeenCalledTimes(1);
    expect(f.lose).toHaveBeenCalledWith("combat_operation_append_failed");
    f.capture.dispose();
  });

  it("preserves the original thrown value and never claims a committed attack after native rejection", () => {
    const f = fixture(), error = new Error("native failure");
    f.attack.useAttack.mockImplementation(() => { throw error; });
    f.capture.watch(f.source);
    expect(() => f.attack.useAttack(f.target)).toThrow(error);
    expect(f.operations.map((operation) => operation.kind)).toEqual(["attack_requested"]);
    f.capture.dispose();
  });

  it("does not record an attack request or commit during cooldown", () => {
    const f = fixture();
    f.attack.remainingCooldown = 500;
    f.attack.useAttack.mockImplementation(() => "cooldown-return");
    f.capture.watch(f.source);
    expect(f.attack.useAttack(f.target)).toBe("cooldown-return");
    expect(f.operations).toEqual([]);
    f.capture.dispose();
  });
});
