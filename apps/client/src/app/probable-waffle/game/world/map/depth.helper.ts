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

  static setActorDepth(actor: any) {
    if (!actor.setDepth) return;
    const actorWithDepth = actor as Phaser.GameObjects.Components.Depth;
    actorWithDepth.setDepth(actor.y);
    if (actor.z) {
      const z = actor.z;
      actor.setDepth(actor.y + z * 2);
    }
  }
}
