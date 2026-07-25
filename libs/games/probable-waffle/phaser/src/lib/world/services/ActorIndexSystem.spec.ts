import Phaser from "phaser";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { ActorData, ActorDataKey } from "../../data/actor-data";
import { OwnerComponent } from "../../entity/components/owner-component";
import { ActorIndexSystem } from "./ActorIndexSystem";

describe("ActorIndexSystem ownership conversion", () => {
  it("moves the actor between owner indexes and emits deterministic conversion context", () => {
    (Phaser.GameObjects as unknown as { Events: { DESTROY: string } }).Events = { DESTROY: "destroy" };
    const services: unknown[] = [];
    const scene = Object.assign(Object.create(ProbableWaffleScene.prototype), {
      events: { once: jest.fn() },
      baseGameData: { communicator: {} },
      getSceneGameData: () => ({ services })
    }) as ProbableWaffleScene;
    const index = new ActorIndexSystem(scene);
    services.push(index);
    const id = Object.assign(Object.create(IdComponent.prototype), { id: "actor-1" });
    let owner = 1;
    const ownerComponent = { getOwner: () => owner } as OwnerComponent;
    const actorData = new ActorData(
      new Map([
        [IdComponent, id],
        [OwnerComponent, ownerComponent]
      ]),
      new Map()
    );
    const actor = {
      scene,
      active: true,
      name: ObjectNames.TivaraWorker,
      once: jest.fn(),
      getData: (key: string) => (key === ActorDataKey ? actorData : undefined)
    } as unknown as Phaser.GameObjects.GameObject;
    const ownershipChanged = jest.fn();
    index.actorOwnershipChanged.subscribe(ownershipChanged);
    index.registerActor(actor);

    index.updateActorOwnership(actor, 1, 2);
    owner = 2;

    expect(index.getOwnedActors(1)).toEqual([]);
    expect(index.getOwnedActors(2)).toEqual([actor]);
    expect(ownershipChanged).toHaveBeenCalledWith({ actor, oldOwner: 1, newOwner: 2 });
  });
});
