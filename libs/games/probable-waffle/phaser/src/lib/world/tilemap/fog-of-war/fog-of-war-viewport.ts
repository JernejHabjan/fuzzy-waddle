type FogCameraView = {
  readonly worldView: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  // Phaser exposes this getter at runtime, but its current Camera declaration omits it.
  readonly rotation?: number;
  readonly shakeEffect?: { readonly isRunning: boolean };
};

/** Conservative render coverage only. It never limits logical exploration, actor visibility or AI observations. */
export class FogOfWarViewport {
  private coverage?: { left: number; top: number; right: number; bottom: number };

  constructor(
    private readonly tileWidth: number,
    private readonly tileHeight: number
  ) {}

  needsRedraw(camera: FogCameraView | undefined): boolean {
    const view = this.view(camera);
    if (!view) return this.coverage !== undefined;
    return (
      !this.coverage ||
      view.x < this.coverage.left ||
      view.y < this.coverage.top ||
      view.x + view.width > this.coverage.right ||
      view.y + view.height > this.coverage.bottom
    );
  }

  capture(camera: FogCameraView | undefined): void {
    const view = this.view(camera);
    this.coverage = view
      ? {
          left: view.x - this.tileWidth * 2,
          top: view.y - this.tileHeight * 2,
          right: view.x + view.width + this.tileWidth * 2,
          bottom: view.y + view.height + this.tileHeight * 2
        }
      : undefined;
  }

  intersectsTile(x: number, y: number): boolean {
    const area = this.coverage;
    return (
      !area ||
      (x + this.tileWidth >= area.left && x <= area.right && y + this.tileHeight >= area.top && y <= area.bottom)
    );
  }

  private view(camera: FogCameraView | undefined) {
    const view = camera?.worldView;
    // Phaser's worldView is unrotated and excludes shake. Keep full coverage for those transient camera modes.
    if (
      !view ||
      camera?.rotation !== 0 ||
      camera.shakeEffect?.isRunning ||
      ![view.x, view.y, view.width, view.height].every(Number.isFinite) ||
      view.width <= 0 ||
      view.height <= 0
    )
      return undefined;
    return view;
  }
}
