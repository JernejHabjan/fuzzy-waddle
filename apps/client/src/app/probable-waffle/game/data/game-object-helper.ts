export function getGameObjectBounds(gameObject: Phaser.GameObjects.GameObject): Phaser.Geom.Rectangle | null {
  const boundsComponent = gameObject as any as Phaser.GameObjects.Components.GetBounds;
  if (boundsComponent.getBounds === undefined) return null;
  return boundsComponent.getBounds();
}

export function getGameObjectDepth(gameObject: Phaser.GameObjects.GameObject): number | null {
  const depthComponent = gameObject as any as Phaser.GameObjects.Components.Depth;
  if (depthComponent.depth === undefined) return null;
  return depthComponent.depth;
}
