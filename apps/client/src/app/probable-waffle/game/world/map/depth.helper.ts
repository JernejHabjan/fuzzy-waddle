import { getGameObjectTransform } from "../../data/game-object-helper";
import { getActorComponent } from "../../data/actor-component";
import { FlightComponent } from "../../entity/actor/components/flight-component";

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
    const transform = getGameObjectTransform(actor);
    if (!transform || !actorWithDepth.setDepth) return;
    let newDepth = transform.y;
    if (transform.z) {
      const z = transform.z;
      newDepth = transform.y + z * 2;
    }
    // Adjust for flying units: use the bottom of the vertical line (ground location)
    const flightComponent = getActorComponent(actor, FlightComponent);
    if (flightComponent && flightComponent.flightDefinition?.height) {
      newDepth += flightComponent.flightDefinition.height;
    }
    actorWithDepth.setDepth(newDepth);
  }
}
