import type Phaser from "phaser";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import { ResourceSourceComponent } from "../../../entity/components/resource/resource-source-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import { bindAiRuntimeExistingActors } from "./bind-ai-runtime-existing-actors";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ getGameObjectLogicalTransform: jest.fn() }));
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

it("pins one actual neutral source by exact position, refusing ambiguous, moved or non-resource substitutes", () => {
  const scene = {} as ProbableWaffleScene;
  const first = { scene, active: true, name: ObjectNames.Tree6 } as unknown as Phaser.GameObjects.GameObject;
  const second = { scene, active: true, name: ObjectNames.Tree6 } as unknown as Phaser.GameObjects.GameObject;
  const position = { x: 608, y: 928, z: 0 };
  const preset: AiRuntimePresetWorldV1 = { fixtureId: "neutral-inherited", actors: [], resourceGrants: [],
    provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:12345678" },
    existingActorBindings: [{ fixtureActorId: "local-tree", actorName: ObjectNames.Tree6, owner: null, position }] };
  jest.mocked(getSceneService).mockReturnValue({ getAllIdActors: () => [first, second] } as never);
  let isResource = true;
  jest.mocked(getActorComponent).mockImplementation((actor, component) => {
    if (component === IdComponent) return { id: actor === first ? "tree-one" : "tree-two" } as never;
    if (component === ResourceSourceComponent && isResource) return {} as never;
    return undefined;
  });
  jest.mocked(getGameObjectLogicalTransform).mockImplementation((actor) => actor === first ? position : { ...position, x: -672 });
  const roles = new Map<string, Phaser.GameObjects.GameObject>(), ids: Record<string, string> = {};
  bindAiRuntimeExistingActors(scene, preset, roles, ids);
  expect(roles.get("local-tree")).toBe(first);
  expect(ids["local-tree"]).toBe("tree-one");
  jest.mocked(getGameObjectLogicalTransform).mockReturnValue(position);
  expect(() => bindAiRuntimeExistingActors(scene, preset, new Map(), {})).toThrow("binding_ambiguous");
  jest.mocked(getGameObjectLogicalTransform).mockReturnValue({ ...position, y: 900 });
  expect(() => bindAiRuntimeExistingActors(scene, preset, new Map(), {})).toThrow("binding_ambiguous");
  isResource = false;
  jest.mocked(getGameObjectLogicalTransform).mockReturnValue(position);
  expect(() => bindAiRuntimeExistingActors(scene, preset, new Map(), {})).toThrow("binding_ambiguous");
});
