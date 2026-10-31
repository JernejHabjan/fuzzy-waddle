import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import Phaser from "phaser";
import { Subject } from "rxjs";
import { getActorComponent } from "../../../data/actor-component";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { ProbableWaffleSceneEventName } from "../../../world/services/recovery/probable-waffle-scene-events";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { AiRuntimeProductionWorldCapture } from "./ai-runtime-production-world-capture";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ isSnapshotApplyInProgress: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("./capture-ai-runtime-created-actor", () => ({ captureAiRuntimeCreatedActor: jest.fn() }));

/** Native callback seam only; these synthetic controls never certify a played combat scenario. */
function setup(captureCombat: boolean) {
  const scene = { events: new Phaser.Events.EventEmitter(), players: [{ playerNumber: 2 }],
    sys: { isActive: () => true }, communicator: { playerChanged: { on: new Subject() } }
  } as unknown as ProbableWaffleScene;
  const target = { scene, name: "Sandhold", active: true } as unknown as Phaser.GameObjects.GameObject;
  const attacker = { scene, name: "SkaduweeWarriorMale", active: true } as unknown as Phaser.GameObjects.GameObject;
  const health = { healthComponentData: { health: 80, armour: 0 }, latestDamage: { simulationTick: 20 } };
  jest.mocked(getActorComponent).mockImplementation((actor, component) => {
    if (component === OwnerComponent) return { getOwner: () => actor === target ? 2 : 1 } as never;
    if (component === HealthComponent && actor === target) return health as never;
    return undefined;
  });
  jest.mocked(getSceneService).mockImplementation((_scene, service) => (service === ActorIndexSystem ? {
    actorRegistered: new Subject(), actorUnregistered: new Subject()
  } : { researchCompleted: new Subject() }) as never);
  jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
  jest.mocked(captureAiRuntimeCreatedActor).mockImplementation((actor) => ({
    actorId: actor === target ? "home" : "raider", objectName: actor.name, canonicalObjectName: actor === target ? ObjectNames.Sandhold : ObjectNames.SkaduweeWarriorMale,
    playerNumber: actor === target ? 2 : 1, active: true, alive: true, finished: true, indexed: true
  }));
  const facts: AiRuntimeProductionFactV1[] = [];
  const capture = new AiRuntimeProductionWorldCapture(scene, {
    resources: () => ({ food: 100, wood: 100, stone: 100, minerals: 100 }),
    boundary: (playerNumber) => ({ sequence: facts.length + 1, tick: 20, playerNumber }),
    append: (fact) => facts.push(fact), watchQueue: jest.fn(), unwatchActor: jest.fn()
  }, captureCombat);
  return { scene, target, attacker, health, capture, facts };
}

it("retains detached native damage clocks and exact victim/attacker ownership, then removes its listener", () => {
  const f = setup(true);
  f.scene.events.emit(ProbableWaffleSceneEventName.ScoreDamage, f.target, 20, f.attacker);
  f.health.healthComponentData.health = 1;
  expect(f.facts).toMatchObject([{ kind: "native_damage", playerNumber: 2, tick: 20, damage: {
    amount: 20, healthAfter: 80, damageTick: 20, target: { actorId: "home", playerNumber: 2 },
    initiator: { actorId: "raider", playerNumber: 1 }, initiatorInCaptureScene: true
  } }]);
  f.capture.dispose();
  expect(f.scene.events.listenerCount(ProbableWaffleSceneEventName.ScoreDamage)).toBe(0);
  f.scene.events.emit(ProbableWaffleSceneEventName.ScoreDamage, f.target, 20, f.attacker);
  expect(f.facts).toHaveLength(1);
});

it("installs no damage listener in unmarked capture and ignores a foreign victim", () => {
  const unmarked = setup(false);
  expect(unmarked.scene.events.listenerCount(ProbableWaffleSceneEventName.ScoreDamage)).toBe(0);
  unmarked.capture.dispose();
  const f = setup(true), foreign = { ...f.target, scene: {} };
  f.scene.events.emit(ProbableWaffleSceneEventName.ScoreDamage, foreign, 20, f.attacker);
  expect(f.facts).toEqual([]);
  f.capture.dispose();
});
