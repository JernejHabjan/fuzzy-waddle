import { getActorComponent } from "../../../../data/actor-component";
import { HealthComponent } from "./health-component";
import { onObjectReady } from "../../../../data/game-object-helper";
import { getSceneService } from "../../../../world/services/scene-component-helpers";
import { AudioService } from "../../../../world/services/audio.service";
import { SharedActorActionsSfxHealSounds } from "../../../../sfx/SharedActorActionsSfx";
import { type HealingComponentData } from "@fuzzy-waddle/api-interfaces";

export type HealingDefinition = {
  healPerCooldown: number;
  cooldown: number;
  range: number;
};

export class HealingComponent {
  // onCooldownReady: EventEmitter<GameObject> = new EventEmitter<GameObject>();
  remainingCooldown = 0;
  private audioService?: AudioService;
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly healingDefinition: HealingDefinition
  ) {
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    onObjectReady(gameObject, this.init, this);
  }

  private init() {
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
  }

  private update(_: number, delta: number): void {
    if (this.remainingCooldown <= 0) {
      return;
    }
    this.remainingCooldown -= delta;
    this.remainingCooldown = Math.max(this.remainingCooldown, 0);
    // if (this.remainingCooldown <= 0) {
    //   this.onCooldownReady.emit(this.gameObject);
    // }
  }

  heal(target: Phaser.GameObjects.GameObject) {
    if (this.remainingCooldown > 0) return;
    const targetHealthComponent = getActorComponent(target, HealthComponent);
    if (!targetHealthComponent) return;
    targetHealthComponent.heal(this.healingDefinition.healPerCooldown);
    this.remainingCooldown = this.healingDefinition.cooldown;
    this.playHealSound();
  }

  private playHealSound() {
    const soundDefinitions = SharedActorActionsSfxHealSounds;
    const soundDefinition = soundDefinitions[Math.floor(Math.random() * soundDefinitions.length)]!;
    this.audioService?.playAudioSprite(soundDefinition.key, soundDefinition.spriteName);
  }

  getHealRange() {
    return this.healingDefinition.range;
  }

  private destroy() {
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  setData(data: Partial<HealingComponentData>) {
    if (data.remainingCooldown !== undefined) this.remainingCooldown = data.remainingCooldown;
  }

  getData(): HealingComponentData {
    return {
      remainingCooldown: this.remainingCooldown
    } satisfies HealingComponentData;
  }
}
