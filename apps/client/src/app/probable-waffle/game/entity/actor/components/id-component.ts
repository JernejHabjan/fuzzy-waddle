import { Guid } from "@fuzzy-waddle/api-interfaces";

export class IdComponent {
  readonly id = new Guid().value;
}
