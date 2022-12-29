export class ResourceType {
  constructor(public name: string, public icon: string, public color: string) {}
}

export class Resources {
  static readonly gold = new ResourceType('Gold', 'gold', 'yellow');
}
