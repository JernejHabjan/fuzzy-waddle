import GameObject = Phaser.GameObjects.GameObject;
import { getGameObjectBounds, getGameObjectDepth } from "../../../data/game-object-helper";

export class SelectableComponent {
  private selected: boolean = false;
  private selectionCircle!: any;
  constructor(private readonly gameObject: GameObject) {
    this.createSelectionCircle();
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy);
  }

  private createSelectionCircle() {
    const bounds = getGameObjectBounds(this.gameObject);
    if (!bounds) return;
    const ellipse = new Phaser.Geom.Ellipse(0, 0, bounds.width, bounds.width / 2);
    const graphics = this.gameObject.scene.add.graphics();
    graphics.lineStyle(2, 0xffffff); // todo color from player
    graphics.strokeEllipseShape(ellipse);
    graphics.visible = false;
    this.selectionCircle = graphics;
    this.gameObject.scene.add.existing(graphics);
  }
  setSelected(selected: boolean) {
    if (this.selected === selected) return;
    this.selected = selected;
    this.selectionCircle.visible = selected;
    if (selected) this.update();
    console.warn(`Selected set to ${selected} for ${this.gameObject.constructor.name}`);
  }

  getSelected(): boolean {
    return this.selected;
  }

  update() {
    // todo use
    this.setPosition();
    this.setDepth();
  }

  private setPosition() {
    const transform = this.gameObject as unknown as Phaser.GameObjects.Components.Transform;
    if (transform.x === undefined || transform.y === undefined) return;
    this.selectionCircle.setPosition(transform.x, transform.y); // todo
  }

  private setDepth() {
    const gameObjectDepth = getGameObjectDepth(this.gameObject);
    if (gameObjectDepth !== null) this.selectionCircle.depth = gameObjectDepth - 1;
  }

  private destroy = () => {
    this.selectionCircle.destroy();
  };
}
