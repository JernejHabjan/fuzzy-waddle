import type Phaser from "phaser";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import { bindAiRuntimeExistingActors } from "./bind-ai-runtime-existing-actors";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../data/tech-tree/canonical-actor-name", () => ({
  getCanonicalActorNameCached: (name: string) => name
}));

it("binds exactly one live inherited actor without changing or creating the actor", () => {
  const scene = {} as ProbableWaffleScene;
  const actor = { scene, active: true, name: ObjectNames.Sandhold } as unknown as Phaser.GameObjects.GameObject;
  const preset: AiRuntimePresetWorldV1 = {
    fixtureId: "inherited-main",
    actors: [],
    resourceGrants: [],
    provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:00000000" },
    existingActorBindings: [{ fixtureActorId: "main-producer", owner: 2, actorName: ObjectNames.Sandhold }]
  };
  let candidates = [actor];
  jest.mocked(getSceneService).mockReturnValue({ getOwnedActors: () => candidates } as never);
  jest
    .mocked(getActorComponent)
    .mockImplementation(
      (_actor, component) =>
        (component === IdComponent
          ? { id: "actual-main" }
          : component === OwnerComponent
            ? { getOwner: () => 2 }
            : component === HealthComponent
              ? { killed: false }
              : undefined) as never
    );
  const roles = new Map<string, Phaser.GameObjects.GameObject>(),
    ids: Record<string, string> = {};
  bindAiRuntimeExistingActors(scene, preset, roles, ids);
  expect(roles.get("main-producer")).toBe(actor);
  expect(ids).toEqual({ "main-producer": "actual-main" });
  expect(actor).toEqual({ scene, active: true, name: ObjectNames.Sandhold });
  expect(() => bindAiRuntimeExistingActors(scene, preset, roles, ids)).toThrow("binding_ambiguous");
  candidates = [actor, { ...actor } as Phaser.GameObjects.GameObject];
  expect(() => bindAiRuntimeExistingActors(scene, preset, new Map(), {})).toThrow("binding_ambiguous");
  actor.active = false;
  candidates = [actor];
  expect(() => bindAiRuntimeExistingActors(scene, preset, new Map(), {})).toThrow("binding_ambiguous");
});
