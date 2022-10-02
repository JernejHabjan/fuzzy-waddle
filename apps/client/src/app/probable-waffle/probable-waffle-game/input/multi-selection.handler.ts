import * as Phaser from 'phaser';
import { Subject } from 'rxjs';

export class MultiSelectionHandler {
  onSelect: Subject<Phaser.Geom.Rectangle> = new Subject();
  onPreview: Subject<Phaser.Geom.Rectangle> = new Subject();
  private selection: Phaser.GameObjects.Rectangle;
  private input: Phaser.Input.InputPlugin;
  private mainCamera: Phaser.Cameras.Scene2D.Camera;
  private selectionRect: Phaser.Geom.Rectangle | null = null;

  constructor(scene: Phaser.Scene, input: Phaser.Input.InputPlugin, mainCamera: Phaser.Cameras.Scene2D.Camera) {
    this.input = input;
    this.mainCamera = mainCamera;
    this.selection = scene.add.rectangle(0, 0, 0, 0, 0x1d7196, 0.5).setDepth(Phaser.Math.MAX_SAFE_INTEGER);
    this.setupEvents();
  }

  private setupEvents() {
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    this.selection.x = pointer.worldX;
    this.selection.y = pointer.worldY;
    this.selectionRect = null;
  }

  private handlePointerUp() {
    this.selection.width = 0;
    this.selection.height = 0;

    this.onSelect.next(this.selectionRect as Phaser.Geom.Rectangle);

    this.selectionRect = null;
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (!pointer.isDown) {
      return;
    }

    const prevWorldPosition = this.mainCamera.getWorldPoint(pointer.prevPosition.x, pointer.prevPosition.y);
    const dx = pointer.worldX - prevWorldPosition.x;
    const dy = pointer.worldY - prevWorldPosition.y;

    this.selection.width += dx;
    this.selection.height += dy;

    // create a new Rectangle
    this.selectionRect = new Phaser.Geom.Rectangle(
      this.selection.x,
      this.selection.y,
      this.selection.width,
      this.selection.height
    );

    // check if width or height is negative
    // and then adjust
    if (this.selectionRect.width < 0) {
      this.selectionRect.x += this.selectionRect.width;
      this.selectionRect.width *= -1;
    }
    if (this.selectionRect.height < 0) {
      this.selectionRect.y += this.selectionRect.height;
      this.selectionRect.height *= -1;
    }

    // use the new Rectangle to check for overlap
    this.onPreview.next(this.selectionRect);
  }

  overlapsBounds(rect: Phaser.Geom.Rectangle, bounds: Phaser.Geom.Rectangle): boolean {
    if (!this.selectionRect) return false;
    return Phaser.Geom.Rectangle.Overlaps(rect, bounds);
  }

  destroy() {
    this.input.off(Phaser.Input.Events.POINTER_DOWN);
    this.input.off(Phaser.Input.Events.POINTER_MOVE);
    this.input.off(Phaser.Input.Events.POINTER_UP);
  }
}
