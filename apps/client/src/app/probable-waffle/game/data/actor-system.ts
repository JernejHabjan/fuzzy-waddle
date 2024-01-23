import GameObject = Phaser.GameObjects.GameObject;
import { ActorData, ActorDataKey } from "./actor-data";

export function getActorSystem<T>(actor: GameObject, systemClass: new (...args: any[]) => T): T | undefined {
  const component = (actor.getData(ActorDataKey) as ActorData)?.systems?.find((c) => c instanceof systemClass);
  if (!component) {
    return undefined;
  }
  return component;
}
