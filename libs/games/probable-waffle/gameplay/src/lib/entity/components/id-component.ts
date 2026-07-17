import { type ActorId, Guid, type IdComponentData } from "@fuzzy-waddle/api-interfaces";

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
