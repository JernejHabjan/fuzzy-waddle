import GameObject = Phaser.GameObjects.GameObject;
import { ActorData, ActorDataKey } from "./actor-data";

export function getActorComponent<T>(actor: GameObject, componentClass: new (...args: any[]) => T): T | undefined {
  const actorData = actor.getData(ActorDataKey) as ActorData;
  return actorData?.components.get(componentClass);
}
