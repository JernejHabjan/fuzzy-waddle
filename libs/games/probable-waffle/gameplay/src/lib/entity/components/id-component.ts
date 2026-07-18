import { type ActorId } from "@fuzzy-waddle/platform-game-sessions";
import { Guid } from "@fuzzy-waddle/platform-identity";
import { type IdComponentData } from "@fuzzy-waddle/probable-waffle-protocol";

export class IdComponent {
  id: ActorId = new Guid().value;

  setId(id: ActorId) {
    this.id = id;
  }

  setData(data: Partial<IdComponentData>) {
    if (data.id) this.setId(data.id);
  }

  getData(): IdComponentData {
    return {
      id: this.id
    } satisfies IdComponentData;
  }
}
