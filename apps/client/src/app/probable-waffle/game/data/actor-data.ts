import { IComponent } from "../core/component.service";

export const ActorDataKey = "actorData";
export class ActorData {
  constructor(
    public readonly components: any[],
    public readonly systems: any[]
  ) {}
}
