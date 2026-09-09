import Phaser from "phaser";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { ActorData, ActorDataKey, applyActorDefinitionToActor } from "./actor-data";
import { ActorManager } from "./actor-manager";
import { GathererComponent } from "../entity/components/resource/gatherer-component";
import { TendableComponent } from "../entity/components/tendable/tendable-component";
import { ConvertibleComponent } from "../entity/components/convertible-component";

describe("Stage 5 AI-relevant actor continuation", () => {
  it("round-trips gathering assignments, crop tenders and conversion cadence by stable identity", () => {
    const gathering = {
      carriedResourceAmount: 3,
      carriedResourceType: ResourceType.Wood,
      remainingCooldown: 450,
      currentResourceSourceId: "tree-7",
      previousResourceSourceId: "tree-3",
      previousResourceType: ResourceType.Wood
    };
    const tending = { growthPercent: 77, tenderIds: ["worker-2", "worker-1"] };
    const conversion = { detectionRange: 8, checkInterval: 500, accumulatedTime: 250, converted: false };
    const source = fakeActor(
      new Map<any, any>([
        [GathererComponent, dataComponent(gathering)],
        [TendableComponent, dataComponent(tending)],
        [ConvertibleComponent, dataComponent(conversion)]
      ])
    );

    const saved = ActorManager.getActorDefinitionFromActor(source)!;
    expect(saved.gatherer).toEqual(gathering);
    expect(saved.tendable).toEqual(tending);
    expect(saved.convertible).toEqual(conversion);

    const restoredGatherer = restoreComponent();
    const restoredTendable = restoreComponent();
    const restoredConvertible = restoreComponent();
    applyActorDefinitionToActor(
      fakeActor(
        new Map<any, any>([
          [GathererComponent, restoredGatherer],
          [TendableComponent, restoredTendable],
          [ConvertibleComponent, restoredConvertible]
        ])
      ),
      saved
    );

    expect(restoredGatherer.saved).toEqual(gathering);
    expect(restoredTendable.saved).toEqual(tending);
    expect(restoredConvertible.saved).toEqual(conversion);
  });
});

function fakeActor(components: Map<any, any>): Phaser.GameObjects.GameObject {
  const actorData = new ActorData(components, new Map());
  return {
    name: ObjectNames.TivaraWorkerFemale,
    getData: (key: string) => (key === ActorDataKey ? actorData : undefined),
    scene: {},
    setDepth: jest.fn()
  } as unknown as Phaser.GameObjects.GameObject;
}

function dataComponent<T>(data: T): { getData: () => T } {
  return { getData: () => data };
}

function restoreComponent() {
  return {
    saved: undefined as unknown,
    setData(data: unknown) {
      this.saved = data;
    }
  };
}
