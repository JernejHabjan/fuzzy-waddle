export class ResourceTypeDefinition {
  constructor(
    public name: string,
    public icon: string,
    public color: string
  ) {}
}

export enum ResourceType {
  Ambrosia = "ambrosia",
  Wood = "wood",
  Stone = "stone",
  Minerals = "minerals",
  Food = "food"
}
