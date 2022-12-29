import { IComponent } from '../../services/component.service';
import { Actor } from '../../actor';
import { DamageType } from './damage-type';
import { EventEmitter } from '@angular/core';
import { ActorDeathType } from './actor-death-type';

export type HealthDefinition = {
  maxHealth: number;
  // todo maybe armor type..
};

export default class HealthComponent implements IComponent {
  private graphics?: Phaser.GameObjects.Graphics;
  private barWidth = 25;
  private barHeight = 4;

  private currentHealth: number;

  healthChanged: EventEmitter<number> = new EventEmitter<number>();

  constructor(
    private readonly gameObject: Phaser.GameObjects.Sprite,
    public healthDefinition: HealthDefinition,
    regenerateHealth: boolean = false,
    private regenerateHealthRate: number = 0,
    private actorDeathType?: ActorDeathType,
    private actorDeathSound?: string
  ) {
    this.currentHealth = healthDefinition.maxHealth;
  }

  init() {
    // do nothing
  }

  start() {
    const { scene } = this.gameObject;
    this.graphics = scene.add.graphics();

    this.graphics.fillStyle(0xffffff);
    this.graphics.fillRect(0, 0, this.barWidth, this.barHeight);
  }

  update(time: number, delta: number) {
    // move graphics with player
    if (!this.graphics) {
      return;
    }

    // set this health-bar to be above the player center horizontally
    // get gameObject width
    const { height, x: objectCenterX, y: objectCenterY } = this.gameObject;

    // set graphics x to be half of gameObject width
    const x = objectCenterX - this.barWidth / 2;
    this.graphics.setPosition(x, objectCenterY - height / 2);

    // set depth to be above player
    this.graphics.depth = this.gameObject.depth + 1;
  }

  takeDamage(damage: number, damageType: DamageType, actor: Actor) {
    this.SetCurrentHealth(this.currentHealth - damage, actor);
  }

  killActor() {
    this.gameObject.destroy();
    // todo something else as well
  }

  SetCurrentHealth(newHealth: number, actor?: Actor) {
    this.currentHealth = newHealth;
    this.healthChanged.emit(this.currentHealth);
    if (this.currentHealth <= 0) {
      this.killActor();
    }
  }

  GetCurrentHealth() {
    return this.currentHealth;
  }
}
