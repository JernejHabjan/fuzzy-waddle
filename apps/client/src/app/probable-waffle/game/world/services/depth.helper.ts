import { getGameObjectLogicalTransform, getGameObjectRenderedTransform } from "../../data/game-object-helper";
import { getActorComponent } from "../../data/actor-component";
import { FlyingComponent } from "../../entity/components/movement/flying-component";

export class DepthHelper {
  constructor(private readonly scene: Phaser.Scene) {
    this.handleSortOfStaticObjects();
  }

  private handleSortOfStaticObjects = () => {
    const children = this.scene.children;
    children.each((child: any) => {
      DepthHelper.setActorDepth(child);
    });
  };

  static setActorDepth(actor: Phaser.GameObjects.GameObject) {
    const actorWithDepth = actor as any as Phaser.GameObjects.Components.Depth;
    const transform = getGameObjectLogicalTransform(actor);
    if (!transform || !actorWithDepth.setDepth) return;
    let newDepth = transform.y;
    if (transform.z) {
      const z = transform.z;
      newDepth = transform.y + z * 2;
    }
    // Adjust for flying units: use the bottom of the vertical line (ground location)
    const flyingComponent = getActorComponent(actor, FlyingComponent);
    if (flyingComponent && flyingComponent.flightDefinition?.height) {
      newDepth += flyingComponent.flightDefinition.height; // todo - maybe this should be added to Z instead?
    }
    actorWithDepth.setDepth(newDepth);
  }
}
