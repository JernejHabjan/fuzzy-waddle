import Phaser from "phaser";
import { asCampaignContentId } from "@fuzzy-waddle/probable-waffle-campaign";
import { ActorData, ActorDataKey } from "../../data/actor-data";
import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { ScenarioActorReferenceComponent } from "./scenario-actor-reference.component";
import { IndexedScenarioReferenceRegistry, ScenarioReferenceError } from "./scenario-reference-registry";
import type { ScenarioMarkerKind } from "./scenario-marker";

describe("IndexedScenarioReferenceRegistry", () => {
  beforeAll(() => {
    (Phaser.GameObjects as unknown as { Events: { DESTROY: string } }).Events = { DESTROY: "destroy" };
  });

  it("compiles markers once and serves indexed runtime queries", () => {
    const registry = new IndexedScenarioReferenceRegistry();
    registry.initialize(
      fakeScene([
        marker("point", "start", { x: 1, y: 2, z: 3 }),
        marker("point", "finish", { x: 9, y: 2, z: 3 }),
        marker("region", "yard", {
          x: 5,
          y: 5,
          width: 10,
          height: 10,
          shape: "rectangle",
          polygonPoints: "",
          elevationPolicy: "any",
          elevation: 0,
          minimumElevation: 0,
          maximumElevation: 0
        }),
        marker("route", "patrol", { pointIds: "start,finish", loop: true, facingAngles: "0,180" }),
        marker("spawn-set", "reinforcements", { pointIds: "finish,start" }),
        marker("group", "allies", { memberActorIds: "hero", requiredTags: "friendly,alive" }),
        marker("camera-shot", "opening", { x: 4, y: 6, z: 2, zoom: 1.5, durationTicks: 30, letterbox: true })
      ])
    );
    const hero = fakeActor("hero", ["alive", "friendly"], { x: 2, y: 2, z: 0 });
    registry.registerActor(hero.actor);

    expect(registry.actor(asCampaignContentId<"scenario-actor">("hero"))).toBe(hero.actor);
    expect(registry.point(asCampaignContentId<"scenario-point">("start"))).toEqual({ x: 1, y: 2, z: 3 });
    expect(registry.route(asCampaignContentId<"scenario-route">("patrol"))).toMatchObject({
      loop: true,
      facingAngles: [0, 180],
      points: [
        { x: 1, y: 2, z: 3 },
        { x: 9, y: 2, z: 3 }
      ]
    });
    expect(registry.group(asCampaignContentId<"scenario-group">("allies"))).toEqual([hero.actor]);
    expect(
      registry.actorRegions(asCampaignContentId<"scenario-actor">("hero")).map((region) => region.definition.id)
    ).toEqual(["yard"]);
    expect(registry.cameraShot(asCampaignContentId<"scenario-camera-shot">("opening"))).toMatchObject({
      center: { x: 4, y: 6, z: 2 },
      zoom: 1.5,
      durationTicks: 30,
      letterbox: true
    });
    expect(registry.spawnSet(asCampaignContentId<"scenario-spawn-set">("reinforcements"))?.points).toEqual([
      { x: 9, y: 2, z: 3 },
      { x: 1, y: 2, z: 3 }
    ]);
    expect(registry.debugFocus("yard")).toEqual({ x: 5, y: 5, z: 0 });

    hero.emitDestroy();
    expect(registry.actor(asCampaignContentId<"scenario-actor">("hero"))).toBeUndefined();
  });

  it("rejects duplicate runtime roles without losing the actor's prior role", () => {
    const registry = new IndexedScenarioReferenceRegistry();
    const hero = fakeActor("hero", []);
    const scout = fakeActor("scout", []);
    registry.registerActor(hero.actor);
    registry.registerActor(scout.actor);

    expect(() => registry.claimActorRole(scout.actor, asCampaignContentId<"scenario-actor">("hero"))).toThrow(
      ScenarioReferenceError
    );
    expect(registry.actor(asCampaignContentId<"scenario-actor">("scout"))).toBe(scout.actor);
  });
});

function fakeScene(markers: Phaser.GameObjects.GameObject[]): ProbableWaffleScene {
  const scene = new ProbableWaffleScene();
  // The shared Scene mock is headless; retain real scene data and supply only registry-facing plugins.
  Object.defineProperties(scene, {
    scene: { value: { key: "ScenarioTest" } },
    children: { value: { list: markers } },
    events: { value: new Phaser.Events.EventEmitter() }
  });
  return scene;
}

function marker(kind: ScenarioMarkerKind, scenarioId: string, properties: Record<string, unknown>) {
  const scene = { sys: { queueDepthSort: jest.fn() } } as unknown as Phaser.Scene;
  return Object.assign(new Phaser.GameObjects.GameObject(scene, "scenario-marker-fixture"), {
    scenarioMarkerKind: kind,
    scenarioId,
    x: 0,
    y: 0,
    ...properties
  });
}

function fakeActor(roleId: string, tags: string[], transform = { x: 0, y: 0, z: 0 }) {
  const scenario = new ScenarioActorReferenceComponent();
  scenario.setData({ roleId, tags });
  const actorData = new ActorData(new Map([[ScenarioActorReferenceComponent, scenario]]), new Map());
  const scene = { sys: { queueDepthSort: jest.fn() } } as unknown as Phaser.Scene;
  const actor = Object.assign(new Phaser.GameObjects.GameObject(scene, "scenario-actor-fixture"), {
    ...transform,
    hasTransformComponent: true,
    getData: (key: string) => (key === ActorDataKey ? actorData : undefined)
  });
  return { actor, emitDestroy: () => actor.emit(Phaser.GameObjects.Events.DESTROY) };
}
