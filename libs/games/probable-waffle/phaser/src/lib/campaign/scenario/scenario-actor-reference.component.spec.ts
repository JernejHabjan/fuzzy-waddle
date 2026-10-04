import Phaser from "phaser";
import { ObjectNames, type OwnerComponentData } from "@fuzzy-waddle/probable-waffle-protocol";
import { ActorData, ActorDataKey, applyActorDefinitionToActor } from "../../data/actor-data";
import { ActorManager } from "../../data/actor-manager";
import { OwnerComponent } from "../../entity/components/owner-component";
import { ScenarioActorReferenceComponent } from "./scenario-actor-reference.component";

describe("ScenarioActorReferenceComponent", () => {
  it("survives ownership conversion and the actor save/load path", () => {
    const source = new ScenarioActorReferenceComponent();
    source.setData({ roleId: "  camp-hero  ", tags: ["leader", " ally ", "leader"] });
    const sourceOwner = fakeOwner(1);
    const sourceActor = fakeActor(source, sourceOwner);
    sourceOwner.setData({ ownerId: 2 });
    const saved = ActorManager.getActorDefinitionFromActor(sourceActor)!;

    const restored = new ScenarioActorReferenceComponent();
    const restoredOwner = fakeOwner();
    applyActorDefinitionToActor(fakeActor(restored, restoredOwner), saved);

    expect(saved.scenario).toEqual({ roleId: "camp-hero", tags: ["ally", "leader"] });
    expect(restored.getData()).toEqual({ roleId: "camp-hero", tags: ["ally", "leader"] });
    expect(restoredOwner.getData()).toEqual({ ownerId: 2 });
  });

  it("omits actors without an authored or runtime role", () => {
    expect(new ScenarioActorReferenceComponent().getData()).toBeUndefined();
  });

  it("rejects unstable actor roles and tags", () => {
    const component = new ScenarioActorReferenceComponent();
    expect(() => component.setData({ roleId: "Editor Hero", tags: [] })).toThrow("lowercase kebab-case");
    expect(() => component.setData({ roleId: "hero", tags: ["Allies Group"] })).toThrow("lowercase kebab-case");
  });
});

function fakeActor(component: ScenarioActorReferenceComponent, owner = fakeOwner()): Phaser.GameObjects.GameObject {
  const actorData = new ActorData(
    new Map<any, any>([
      [ScenarioActorReferenceComponent, component],
      [OwnerComponent, owner]
    ]),
    new Map()
  );
  return {
    name: ObjectNames.TivaraWorkerFemale,
    getData: (key: string) => (key === ActorDataKey ? actorData : undefined)
  } as unknown as Phaser.GameObjects.GameObject;
}

function fakeOwner(initialOwnerId?: number) {
  let ownerId = initialOwnerId;
  return {
    setData: (data: Partial<OwnerComponentData>) => {
      ownerId = data.ownerId;
    },
    getData: (): OwnerComponentData => ({ ownerId })
  };
}
