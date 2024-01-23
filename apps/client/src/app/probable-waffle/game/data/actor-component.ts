import GameObject = Phaser.GameObjects.GameObject;
import { ActorData, ActorDataKey } from "./actor-data";

export function getActorComponent<T>(actor: GameObject, componentClass: new (...args: any[]) => T): T | undefined {
  const component = (actor.getData(ActorDataKey) as ActorData)?.components?.find((c) => c instanceof componentClass);
  if (!component) {
    return undefined;
  }
  return component;
}
