import { AnimationsLizard, AssetsDungeon } from "../assets";

enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT
}

/**
 * so we're no setting new direction the same as previous
 */
const randomDirection = (exclude: Direction) => {
  let newDirection = Phaser.Math.Between(0, 3);
  while (newDirection === exclude) {
    newDirection = Phaser.Math.Between(0, 3);
  }
  return newDirection;
};

export default class Lizard extends Phaser.Physics.Arcade.Sprite {
  private direction: Direction = Phaser.Math.Between(0, 3);
  private moveEvent: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, frame?: string | number) {
    super(scene, x, y, AssetsDungeon.lizard, frame);

    this.anims.play(AnimationsLizard.idle);
    scene.physics.world.on(Phaser.Physics.Arcade.Events.TILE_COLLIDE, this.handleTileCollision, this);

    // move randomly every 2 seconds
    this.moveEvent = scene.time.addEvent({
      delay: 2000,
      callback: () => (this.direction = randomDirection(this.direction)),
      loop: true
    });
  }

  override destroy(fromScene?: boolean) {
    this.moveEvent.destroy();
    super.destroy(fromScene);
  }

  createCallback() {
    // TILE_COLLIDE requires onCollide to be true
    this.body!.onCollide = true;
  }

  override preUpdate(t: number, dt: number) {
    super.preUpdate(t, dt);
    const speed = 50;
    switch (this.direction) {
      case Direction.UP:
        this.setVelocity(0, -speed);
        break;
      case Direction.DOWN:
        this.setVelocity(0, speed);
        break;
      case Direction.LEFT:
        this.setVelocity(-speed, 0);
        break;
      case Direction.RIGHT:
        this.setVelocity(speed, 0);
        break;
    }
  }

  // noinspection JSUnusedLocalSymbols
  private handleTileCollision(go: Phaser.GameObjects.GameObject, tile: Phaser.Tilemaps.Tile) {
    // if this object didn't collide with the tile
    if (go !== this) return;

    // change direction
    this.direction = randomDirection(this.direction);
  }
}
