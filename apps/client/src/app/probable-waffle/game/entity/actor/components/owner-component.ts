import GameObject = Phaser.GameObjects.GameObject;
import { getActorComponent } from "../../../data/actor-component";

export class OwnerComponent {
  private owner?: number;
  constructor(private readonly gameObject: GameObject) {}

  setOwner(playerNumber: number) {
    this.owner = playerNumber;
    console.log(`Owner set to ${playerNumber} for ${this.gameObject.constructor.name}`);
  }

  clearOwner() {
    this.owner = undefined;
  }

  getOwner(): number | undefined {
    return this.owner;
  }

  isSameTeamAsGameObject(gameObject: Phaser.GameObjects.GameObject) {
    const ownerComponent = getActorComponent(gameObject, OwnerComponent);
    if (!ownerComponent) {
      return false;
    }
    return ownerComponent.getOwner() === this.getOwner();
  }
}
