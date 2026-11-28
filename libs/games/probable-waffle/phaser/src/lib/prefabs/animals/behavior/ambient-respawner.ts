import Phaser from "phaser";

/** Owns one ambient spawn point until its scene shuts down. */
export class AmbientRespawner<T extends Phaser.GameObjects.GameObject> {
  private pending?: Phaser.Time.TimerEvent;
  private stopped = false;

  constructor(
    private readonly scene: Phaser.Scene,
    initial: T,
    private readonly spawn: () => T,
    private readonly minDelayMs: number,
    private readonly maxDelayMs: number
  ) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.observe(initial);
  }

  private observe(object: T): void {
    object.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.stopped) return;
      this.pending = this.scene.time.delayedCall(Phaser.Math.Between(this.minDelayMs, this.maxDelayMs), () => {
        this.pending = undefined;
        if (!this.stopped) this.observe(this.spawn());
      });
    });
  }

  private destroy(): void {
    this.stopped = true;
    this.pending?.remove(false);
    this.pending = undefined;
  }
}
