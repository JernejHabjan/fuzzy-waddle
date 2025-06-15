import { getGameObjectTransform } from "../../data/game-object-helper";

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
    actorWithDepth.setDepth(transform.y);
    if (transform.z) {
      const z = transform.z;
      actorWithDepth.setDepth(transform.y + z * 2);
    }
  }
}
