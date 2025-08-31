import { Guid, type IdComponentData } from "@fuzzy-waddle/api-interfaces";

export class IdComponent {
  id = new Guid().value;

  setId(id: string) {
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
