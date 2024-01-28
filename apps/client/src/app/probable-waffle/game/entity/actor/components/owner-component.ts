import GameObject = Phaser.GameObjects.GameObject;

export class OwnerComponent {
  private owner?: number;
  constructor(private readonly gameObject: GameObject) {}

  setOwner(playerNumber: number) {
    this.owner = playerNumber;
    console.warn(`Owner set to ${playerNumber} for ${this.gameObject.constructor.name}`);
  }

  clearOwner() {
    this.owner = undefined;
  }

  getOwner(): number | undefined {
    return this.owner;
  }
}
