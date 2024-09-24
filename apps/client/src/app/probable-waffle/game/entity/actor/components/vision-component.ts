import GameObject = Phaser.GameObjects.GameObject;
import { GameplayLibrary } from "../../../library/gameplay-library";
import Spawn from "../../../prefabs/buildings/misc/Spawn";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "./owner-component";
import { HealthComponent } from "../../combat/components/health-component";
import { State } from "mistreevous";

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
      const childOwner = ownerComponent?.getOwner();
      if (!childOwner) return false;
      if (childOwner === owner) return false; // todo this is not respecting teams
      const healthComponent = getActorComponent(c, HealthComponent);
      if (!healthComponent) return false;
      const health = healthComponent.healthComponentData.health;
      return health > 0;
    });

    // todo apply vision radius check here
    this.visibleEnemies = tempEnemies as GameObject[];
    return this.visibleEnemies;
  }

  getClosestVisibleEnemy(): GameObject | null {
    const visibleEnemies = this.getVisibleEnemies();
    if (visibleEnemies.length === 0) return null;
    // find closest enemy
    visibleEnemies.sort((a, b) => {
      const distanceA = GameplayLibrary.getTileDistanceBetweenGameObjects(this.gameObject, a);
      const distanceB = GameplayLibrary.getTileDistanceBetweenGameObjects(this.gameObject, b);
      if (distanceA === null || distanceB === null) return 0;
      return distanceA - distanceB;
    });
    return visibleEnemies[0];
  }
}
