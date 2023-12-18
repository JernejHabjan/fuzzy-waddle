import ActorContainer from "../../entity/actor/ActorContainer";

export class DepthHelper {
  constructor(private readonly scene: Phaser.Scene) {
    this.handleSortOfStaticObjects();
  }

  private handleSortOfStaticObjects = () => {
    const children = this.scene.children;
    children.each((child: any) => {
      if (!child.setDepth) return;
      const childWithDepth = child as Phaser.GameObjects.Components.Depth;
      childWithDepth.setDepth(child.y);
      if (child instanceof ActorContainer) {
        const z = child.z;
        child.setDepth(child.y + z * 2);
      }
    });
  };
}
