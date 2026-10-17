import Phaser from "phaser";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { ActorData, ActorDataChangedEvent, ActorDataKey } from "../../data/actor-data";
import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { OwnerComponent } from "../../entity/components/owner-component";
import { ResourceSourceComponent } from "../../entity/components/resource/resource-source-component";
import { ResourceDrainComponent } from "../../entity/components/resource/resource-drain-component";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { ActorIndexSystem } from "./ActorIndexSystem";

/** Real actor component map and events model a construction shell becoming a fully equipped building. */
function fixture() {
  const services: unknown[] = [];
  const scene = Object.assign(Object.create(ProbableWaffleScene.prototype), {
    events: new Phaser.Events.EventEmitter(),
    sys: { queueDepthSort: () => undefined, isActive: () => true },
    baseGameData: { communicator: {} },
    getSceneGameData: () => ({ services })
  }) as ProbableWaffleScene;
  const index = new ActorIndexSystem(scene);
  services.push(index);
  const actor = new Phaser.GameObjects.GameObject(scene, "fixture");
  actor.name = ObjectNames.Granary;
  const data = new ActorData(new Map(), new Map());
  data.components.set(IdComponent, Object.assign(Object.create(IdComponent.prototype), { id: "new-granary" }));
  data.components.set(OwnerComponent, { getOwner: () => 2 });
  actor.setData(ActorDataKey, data);
  const registered = jest.fn();
  index.actorRegistered.subscribe(registered);
  index.registerActor(actor);
  const install = () => {
    data.components.set(ResourceDrainComponent, { getResourceTypes: () => [ResourceType.Food] });
    data.components.set(ResourceSourceComponent, { getResourceType: () => ResourceType.Food });
    actor.emit(ActorDataChangedEvent, data);
  };
  return { actor, scene, index, data, registered, install };
}

describe("actor resource indexes follow component installation", () => {
  it("indexes completed services and repeated registration without duplicate actor counts or listeners", () => {
    const f = fixture();
    expect(f.index.getResourceDrainsFiltered(2, ResourceType.Food)).toEqual([]);
    f.install();
    f.index.registerActor(f.actor);
    expect(f.index.getResourceDrainsFiltered(2, ResourceType.Food)).toEqual([f.actor]);
    expect(f.index.getResourceSourcesFiltered(ResourceType.Food)).toEqual([f.actor]);
    expect(f.index.getActorTypeCount(2, ObjectNames.Granary)).toBe(1);
    expect(f.registered).toHaveBeenCalledTimes(1);
    expect(f.actor.listenerCount(ActorDataChangedEvent)).toBe(1);
    f.data.components.delete(ResourceDrainComponent);
    f.actor.emit(ActorDataChangedEvent, f.data);
    expect(f.index.getResourceDrainsFiltered(2, ResourceType.Food)).toEqual([]);
  });

  it.each(["death", "shutdown"])(
    "detaches component listeners on %s and cannot resurrect resource entries",
    (boundary) => {
      const f = fixture();
      f.install();
      if (boundary === "death") f.actor.emit(HealthComponent.KilledEvent);
      else f.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
      expect(f.actor.listenerCount(ActorDataChangedEvent)).toBe(0);
      f.actor.emit(ActorDataChangedEvent, f.data);
      expect(f.index.getResourceDrainsFiltered()).toEqual([]);
      expect(f.index.getAllIdActors()).toEqual([]);
    }
  );
});
