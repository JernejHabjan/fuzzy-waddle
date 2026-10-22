import type Phaser from "phaser";
import { getActorComponent } from "../../../data/actor-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { ResourceDrainComponent } from "../../../entity/components/resource/resource-drain-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { captureAiRuntimeProductionFrontier } from "./capture-ai-runtime-production-frontier";
import { AiRuntimeProductionProofCapture } from "./ai-runtime-production-proof-capture";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("./capture-ai-runtime-production-setup", () => ({ captureAiRuntimeProductionSetup: jest.fn(() => ({})) }));
jest.mock("./capture-ai-runtime-production-frontier", () => ({ captureAiRuntimeProductionFrontier: jest.fn() }));

it("pins an existing deposit without a queue or weapon before its first delivery", () => {
  const scene = { players: [{ playerNumber: 2 }] } as unknown as ProbableWaffleScene;
  const deposit = { name: "WorkMill", scene } as unknown as Phaser.GameObjects.GameObject;
  const unrelated = { name: "Wall", scene } as unknown as Phaser.GameObjects.GameObject;
  let close: ((tick: number) => void) | undefined;
  const detach = jest.fn();
  const clock = { currentTick: 0, observeClosedFrontiers: (callback: (tick: number) => void) => {
    close = callback;
    return detach;
  } };
  jest.mocked(getSceneService).mockImplementation((_scene, service) =>
    (service === SimulationTickService ? clock : service === ActorIndexSystem ? {
      getOwnedActors: () => [deposit, unrelated]
    } : undefined) as never
  );
  jest.mocked(getActorComponent).mockImplementation((actor, component) => {
    if (component === IdComponent) return { id: actor === deposit ? "existing-deposit" : "unrelated-wall" } as never;
    if (component === ResourceDrainComponent && actor === deposit) return {} as never;
    return undefined;
  });
  jest.mocked(captureAiRuntimeProductionFrontier).mockReturnValue({
    afterSequence: 0, actors: [], queues: [], completedResearch: [], navigation: null
  });
  const proof = new AiRuntimeProductionProofCapture(scene, () => "unused-item", () => 0);
  proof.arm(2, 1);
  close?.(1);
  expect(captureAiRuntimeProductionFrontier).toHaveBeenCalledWith(
    scene, 2, new Set(["existing-deposit"]), expect.any(Function), 0
  );
  proof.dispose();
  expect(detach).toHaveBeenCalledTimes(1);
});

it.each([false, true])("tracks initial passive assets only for explicit combat capture=%s", (captureCombat) => {
  jest.clearAllMocks();
  const scene = { players: [{ playerNumber: 2 }] } as unknown as ProbableWaffleScene;
  const house = { name: "Olival", scene } as unknown as Phaser.GameObjects.GameObject;
  const carrier = { name: "CommonBoat", scene } as unknown as Phaser.GameObjects.GameObject;
  let close: ((tick: number) => void) | undefined;
  const clock = { currentTick: 0, observeClosedFrontiers: (callback: (tick: number) => void) => {
    close = callback;
    return jest.fn();
  } };
  jest.mocked(getSceneService).mockImplementation((_scene, service) =>
    (service === SimulationTickService ? clock : service === ActorIndexSystem ? {
      getOwnedActors: () => [house, carrier]
    } : undefined) as never);
  jest.mocked(getActorComponent).mockImplementation((actor, component) => {
    if (component === IdComponent) return { id: actor === house ? "original-house" : "original-carrier" } as never;
    return (component === HealthComponent ? {} : undefined) as never;
  });
  jest.mocked(captureAiRuntimeProductionFrontier).mockReturnValue({
    afterSequence: 0, actors: [], queues: [], completedResearch: [], navigation: null
  });
  const proof = new AiRuntimeProductionProofCapture(scene, () => "unused-item", () => 0, captureCombat);
  proof.arm(2, 1);
  close?.(1);
  expect(captureAiRuntimeProductionFrontier).toHaveBeenCalledWith(scene, 2,
    new Set(captureCombat ? ["original-house", "original-carrier"] : []), expect.any(Function), 0);
  proof.dispose();
});
