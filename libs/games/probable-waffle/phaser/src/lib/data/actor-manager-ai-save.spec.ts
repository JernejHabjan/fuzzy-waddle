import Phaser from "phaser";
import { ObjectNames, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { ActorData, ActorDataKey, applyActorDefinitionToActor } from "./actor-data";
import { ActorManager } from "./actor-manager";
import { GathererComponent } from "../entity/components/resource/gatherer-component";
import { TendableComponent } from "../entity/components/tendable/tendable-component";
import { ConvertibleComponent } from "../entity/components/convertible-component";
import { QueueComponent } from "../entity/components/queue/queue-component";
import { ProductionComponent } from "../entity/components/production/production-component";
import { ResearchComponent } from "../entity/components/research/research-component";
import { AttackComponent } from "../entity/components/combat/components/attack-component";
import type { SharedQueueSnapshotData } from "@fuzzy-waddle/probable-waffle-protocol";

describe("Stage 5 AI-relevant actor continuation", () => {
  it("saves one authoritative mixed queue and restores it once instead of replaying legacy lists", () => {
    const snapshot: SharedQueueSnapshotData = { schemaVersion: 1, queues: [[]] };
    const saved = ActorManager.getActorDefinitionFromActor(
      fakeActor(new Map([[QueueComponent, { getSnapshotData: () => snapshot }]]))
    );
    expect(saved?.sharedQueue).toEqual(snapshot);
    const queue = { setSnapshotData: jest.fn() };
    const production = { setData: jest.fn() },
      research = { setData: jest.fn() };
    applyActorDefinitionToActor(
      fakeActor(
        new Map<unknown, unknown>([
          [QueueComponent, queue],
          [ProductionComponent, production],
          [ResearchComponent, research]
        ])
      ),
      {
        ...saved,
        production: { queue: [{ name: ObjectNames.TivaraWorker, remainingTime: 10 }] },
        research: { researches: [{ type: ResearchType.SnowstormSpell, remainingTime: 10 }] }
      }
    );
    expect(queue.setSnapshotData).toHaveBeenCalledTimes(1);
    expect(queue.setSnapshotData).toHaveBeenCalledWith(snapshot);
    expect(production.setData).toHaveBeenCalledWith(expect.any(Object), false);
    expect(research.setData).toHaveBeenCalledWith(expect.any(Object), false);
  });
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

  it("round-trips an in-flight delayed attack impact by stable target and simulation deadline", () => {
    const pendingHit = { targetActorId: "enemy-7", attackIndex: 1, dueTick: 120 };
    const attack = { remainingCooldown: 250, currentAttackIndex: 1, pendingHit };
    const saved = ActorManager.getActorDefinitionFromActor(
      fakeActor(new Map([[AttackComponent, dataComponent(attack)]]))
    );
    const restoredAttack = restoreComponent();

    expect(saved?.attack).toEqual(attack);
    applyActorDefinitionToActor(fakeActor(new Map([[AttackComponent, restoredAttack]])), saved);
    expect(restoredAttack.saved).toEqual(attack);
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
