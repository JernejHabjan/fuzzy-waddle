export const ActorDataKey = "actorData";
export class ActorData {
  constructor(
    public readonly components: any[],
    public readonly systems: any[]
  ) {}
}

export function setActorData(actor: Phaser.GameObjects.GameObject, components: any[], systems: any[]) {
  actor.setData(ActorDataKey, new ActorData(components, systems));
}
