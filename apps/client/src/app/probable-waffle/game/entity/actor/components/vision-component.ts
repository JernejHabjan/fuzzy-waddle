import GameObject = Phaser.GameObjects.GameObject;
import { GameplayLibrary } from "../../../library/gameplay-library";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "./owner-component";
import { HealthComponent } from "../../combat/components/health-component";

export interface VisionDefinition {
  range: number;
}

export class VisionComponent {
  private visibleEnemies?: GameObject[]; // todo

  constructor(
    private readonly gameObject: GameObject,
    private readonly visionDefinition: VisionDefinition
  ) {}

  isActorVisible(actor: GameObject): boolean {
    const distance = GameplayLibrary.getTileDistanceBetweenGameObjects(this.gameObject, actor);
    if (distance === null) {
      return false;
    }
    return distance <= this.visionDefinition.range;
  }

  getVisibleHighValueResources(): GameObject[] {
    return []; // todo
  }

  getVisibleEnemies(): GameObject[] {
    // todo if (this.visibleEnemies) return this.visibleEnemies;
    const currentActorOwnerComponent = getActorComponent(this.gameObject, OwnerComponent);
    const owner = currentActorOwnerComponent?.getOwner();
    if (!owner) return [];

    // todo this is expensive
    const tempEnemies = this.gameObject.scene.children.getChildren().filter((c) => {
      const ownerComponent = getActorComponent(c, OwnerComponent);
      if (!ownerComponent) return false; // No owner
      const childOwner = ownerComponent.getOwner();
      if (!childOwner) return false; // No owner
      if (childOwner === owner) return false; // Same owner
      const isSameTeam = ownerComponent.isSameTeamAsGameObject(this.gameObject);
      if (isSameTeam) return false; // Same team

      const healthComponent = getActorComponent(c, HealthComponent);
      if (!healthComponent || healthComponent.killed) return false; // Dead or no health

      const actorVisible = this.isActorVisible(c as GameObject);
      if (!actorVisible) return false; // Not visible

      return true;
    });

    // todo apply vision radius check here
    this.visibleEnemies = tempEnemies as GameObject[];
    return this.visibleEnemies;
  }

  getClosestVisibleEnemy(): GameObject | null {
    const visibleEnemies = this.getVisibleEnemies();
    if (visibleEnemies.length === 0) return null;
    // find the closest enemy
    visibleEnemies.sort((a, b) => {
      const distanceA = GameplayLibrary.getTileDistanceBetweenGameObjects(this.gameObject, a);
      const distanceB = GameplayLibrary.getTileDistanceBetweenGameObjects(this.gameObject, b);
      if (distanceA === null || distanceB === null) return 0;
      return distanceA - distanceB;
    });
    return visibleEnemies[0];
  }
}
