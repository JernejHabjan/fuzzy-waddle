import Phaser from "phaser";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { ActorData, ActorDataKey } from "../../../data/actor-data";
import { compareAiActorsByStableId, isCampaignAiTargetVisible } from "./world-state-snapshot-manager";

function actorWithId(id: string): Phaser.GameObjects.GameObject {
  const idComponent = Object.assign(Object.create(IdComponent.prototype), { id });
  const actorData = new ActorData(new Map([[IdComponent, idComponent]]), new Map());
  return {
    getData: (key: string) => (key === ActorDataKey ? actorData : undefined)
  } as unknown as Phaser.GameObjects.GameObject;
}

describe("campaign AI visibility", () => {
  it("uses deterministic logical distance from the base and owned vision sources", () => {
    expect(isCampaignAiTargetVisible({ x: 3, y: 4, z: 0 }, [], { x: 0, y: 0, z: 0 }, 5)).toBe(true);
    expect(isCampaignAiTargetVisible({ x: 12, y: 10, z: 0 }, [{ x: 10, y: 10, z: 2 }], undefined, 2)).toBe(true);
    expect(isCampaignAiTargetVisible({ x: 13, y: 10, z: 0 }, [{ x: 10, y: 10, z: 2 }], undefined, 2)).toBe(false);
  });
});

describe("AI actor ordering", () => {
  it("uses stable actor IDs instead of insertion order", () => {
    const actors = [actorWithId("actor-c"), actorWithId("actor-a"), actorWithId("actor-b")];

    expect(actors.sort(compareAiActorsByStableId).map((actor) => getActorId(actor))).toEqual([
      "actor-a",
      "actor-b",
      "actor-c"
    ]);
  });

  it("rejects actors that violate the indexed stable-ID invariant", () => {
    const actorData = new ActorData(new Map(), new Map());
    const actorWithoutId = {
      getData: (key: string) => (key === ActorDataKey ? actorData : undefined)
    } as unknown as Phaser.GameObjects.GameObject;

    expect(() => compareAiActorsByStableId(actorWithoutId, actorWithId("actor-a"))).toThrow(
      "AI actor ordering requires indexed actors with stable IDs"
    );
  });
});

function getActorId(actor: Phaser.GameObjects.GameObject): string | undefined {
  const actorData = actor.getData(ActorDataKey) as ActorData | undefined;
  return (actorData?.components.get(IdComponent) as IdComponent | undefined)?.id;
}
