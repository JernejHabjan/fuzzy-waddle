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
  Minerals = "minerals"
}

export class Resources {
  static readonly ambrosia = new ResourceTypeDefinition("Ambrosia", "ambrosia", "gold");
  static readonly wood = new ResourceTypeDefinition("Wood", "wood", "brown");
  static readonly stone = new ResourceTypeDefinition("Stone", "stone", "grey");
  static readonly minerals = new ResourceTypeDefinition("Minerals", "minerals", "blue");
}
