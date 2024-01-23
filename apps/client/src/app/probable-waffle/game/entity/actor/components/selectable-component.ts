import GameObject = Phaser.GameObjects.GameObject;

export class SelectableComponent {
  private selected: boolean = false;
  private selectionCircle!: any;
  constructor(private readonly gameObject: GameObject) {
    this.createSelectionCircle();
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy);
  }

  private createSelectionCircle() {
    const boundsComponent = this.gameObject as any as Phaser.GameObjects.Components.GetBounds;
    if (boundsComponent.getBounds === undefined) return;
    const bounds = boundsComponent.getBounds();
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
    const transform = this.gameObject as any as Phaser.GameObjects.Components.Transform;
    if (transform.x === undefined || transform.y === undefined) return;
    this.selectionCircle.setPosition(transform.x, transform.y); // todo
  }

  private setDepth() {
    const actorDepth = (this.gameObject as any).depth;
    if (actorDepth !== undefined) this.selectionCircle.depth = actorDepth - 1;
  }

  private destroy = () => {
    this.selectionCircle.destroy();
  };
}
