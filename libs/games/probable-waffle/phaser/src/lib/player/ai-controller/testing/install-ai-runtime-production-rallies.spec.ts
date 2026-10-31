import Phaser from "phaser";
import { Subject } from "rxjs";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { RepresentableComponent } from "../../../entity/components/representable-component";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import { installAiRuntimeProductionRallies } from "./install-ai-runtime-production-rallies";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ getGameObjectCurrentTile: () => ({ x: 1, y: 2 }) }));
jest.mock("../../../data/tech-tree/canonical-actor-name", () => ({
  getCanonicalActorNameCached: (name: string) => name
}));

it("sets normal owned rallies once for the initial producer and an actual ready replacement, then detaches on shutdown", () => {
  const tick$ = new Subject<number>(),
    onShutdown = new Subject<void>(),
    commandOutcome$ = new Subject<unknown>();
  const scene = { events: new Phaser.Events.EventEmitter(), onShutdown } as unknown as ProbableWaffleScene;
  const actor = (name: string) => ({ scene, active: true, name }) as unknown as Phaser.GameObjects.GameObject;
  const original = actor(ObjectNames.AnkGuard),
    replacement = actor(ObjectNames.AnkGuard),
    target = actor(ObjectNames.Olival);
  const ids = new Map([
    [original, "original"],
    [replacement, "replacement"],
    [target, "target"]
  ]);
  let replacementReady = false;
  jest
    .mocked(getActorComponent)
    .mockImplementation(
      (object, component) =>
        (component === IdComponent
          ? { id: ids.get(object) }
          : component === OwnerComponent
            ? { getOwner: () => 2 }
            : component === ProductionComponent
              ? { isFinished: object !== replacement || replacementReady }
              : component === RepresentableComponent
                ? { logicalWorldTransform: { x: 100, y: 100, z: 0 } }
                : undefined) as never
    );
  const clock = { currentTick: 0, tick$ };
  const dispatchDeterministic = jest.fn((input) => {
    const command = { ...input, tick: clock.currentTick, execution: { commandId: input.actorIds[0], source: "human" } };
    commandOutcome$.next({ commandId: command.execution.commandId, kind: "completed" });
    return { status: "dispatched", command };
  });
  const bus = { commandOutcome$, dispatchDeterministic };
  jest.mocked(getSceneService).mockImplementation(
    (_scene, service) =>
      (service === SimulationTickService
        ? clock
        : service === ActorIndexSystem
          ? {
              getOwnedActors: () => [original, replacement]
            }
          : bus) as never
  );
  const preset: AiRuntimePresetWorldV1 = {
    fixtureId: "replacement-rally",
    actors: [],
    resourceGrants: [],
    provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:00000000" },
    productionRallies: [{ owner: 2, producerObjectName: ObjectNames.AnkGuard, targetFixtureActorId: "rally" }]
  };
  installAiRuntimeProductionRallies(scene, preset, new Map([["rally", target]]));
  expect(dispatchDeterministic).toHaveBeenCalledTimes(1);
  tick$.next(1);
  expect(dispatchDeterministic).toHaveBeenCalledTimes(1);
  replacementReady = true;
  clock.currentTick = 10;
  tick$.next(10);
  expect(dispatchDeterministic).toHaveBeenCalledTimes(2);
  expect(dispatchDeterministic.mock.calls[1]?.[0]).toMatchObject({
    actorIds: ["replacement"],
    targetObjectId: "target"
  });
  onShutdown.next();
  expect(tick$.observed).toBe(false);
  expect(commandOutcome$.observed).toBe(false);
});
