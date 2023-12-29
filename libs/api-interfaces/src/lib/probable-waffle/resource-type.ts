export class ResourceType {
  constructor(
    public name: string,
    public icon: string,
    public color: string
  ) {}
}

export class Resources {
  static readonly ambrosia = new ResourceType("Ambrosia", "ambrosia", "gold");
  static readonly wood = new ResourceType("Wood", "wood", "brown");
  static readonly stone = new ResourceType("Stone", "stone", "grey");
  static readonly minerals = new ResourceType("Minerals", "minerals", "blue");
}
