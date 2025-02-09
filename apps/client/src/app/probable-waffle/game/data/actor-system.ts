import GameObject = Phaser.GameObjects.GameObject;
import { ActorData, ActorDataKey } from "./actor-data";

export function getActorSystem<T>(actor: GameObject, systemClass: new (...args: any[]) => T): T | undefined {
  const actorData = actor.getData(ActorDataKey) as ActorData;
  return actorData?.systems.get(systemClass);
}
