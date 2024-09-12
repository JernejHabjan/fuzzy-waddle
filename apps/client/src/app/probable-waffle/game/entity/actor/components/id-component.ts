import { Guid } from "@fuzzy-waddle/api-interfaces";

export class IdComponent {
  id = new Guid().value;

  setId(id: string) {
    this.id = id;
  }
}
