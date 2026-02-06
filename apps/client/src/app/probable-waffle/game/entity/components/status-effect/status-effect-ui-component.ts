import { GameObjects } from 'phaser';
import { StatusEffectComponent } from './status-effect-component';
import { getActorComponent } from '../../../data/actor-component';
import { Subscription } from 'rxjs';
import { getGameObjectBounds, getGameObjectDepth, onObjectReady } from '../../../data/game-object-helper';
import { OwnerComponent } from '../owner-component';
import { ActorTranslateComponent } from '../movement/actor-translate-component';
import { type StatusEffectData, StatusEffectType } from '@fuzzy-waddle/api-interfaces';
import { HealthComponent } from '../combat/components/health-component';
import { HealthUiComponent } from '../combat/components/health-ui-component';

interface EffectBar {
  effectType: StatusEffectType;
  bar: GameObjects.Graphics;
  tintColor: number;
}

export class StatusEffectUiComponent {
  static ZIndex = 2;
  private statusEffectComponent?: StatusEffectComponent;
  private healthComponent?: HealthComponent;
  private effectBars: EffectBar[] = [];
  private barWidth = 25;
  private barHeight = 4;
  private barBorder = 1;
  private barSpacing = 2;

  private actorMovedSubscription?: Subscription;
  private effectAppliedSubscription?: Subscription;
  private effectRemovedSubscription?: Subscription;
  private effectTickSubscription?: Subscription;

  private readonly defaultColors: Record<StatusEffectType, number> = {
    [StatusEffectType.Stunned]: 0x888888,
    [StatusEffectType.Frozen]: 0x6666ff,
    [StatusEffectType.Slowed]: 0x99ccff,
    [StatusEffectType.Burning]: 0xff6600,
    [StatusEffectType.Poisoned]: 0x00ff00,
    [StatusEffectType.Regenerating]: 0x00ff88
  };

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    onObjectReady(gameObject, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
  }

  private init(): void {
    this.statusEffectComponent = getActorComponent(this.gameObject, StatusEffectComponent);
    this.healthComponent = getActorComponent(this.gameObject, HealthComponent);

    if (!this.statusEffectComponent) return;

    this.effectAppliedSubscription = this.statusEffectComponent.effectApplied.subscribe((effect) =>
      this.onEffectApplied(effect)
    );
    this.effectRemovedSubscription = this.statusEffectComponent.effectRemoved.subscribe((type) =>
      this.onEffectRemoved(type)
    );
    this.effectTickSubscription = this.statusEffectComponent.effectTick.subscribe((effect) =>
      this.onEffectTick(effect)
    );

    this.subscribeActorMove();

    // Calculate the bar width based on the parent object's bounds
    const bounds = getGameObjectBounds(this.gameObject);
    if (bounds) {
      this.barWidth = Math.max(Math.round(bounds.width / 3), 25);
    }
  }

  private subscribeActorMove(): void {
    const actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    if (!actorTranslateComponent) return;
    this.actorMovedSubscription = actorTranslateComponent.actorMovedLogicalPosition.subscribe(() => {
      this.updateAllBarPositions();
    });
  }

  private onEffectApplied(effect: StatusEffectData): void {
    // Check if we already have a bar for this effect type
    const existingBar = this.effectBars.find((b) => b.effectType === effect.type);
    if (existingBar) {
      this.drawBar(existingBar, effect);
      return;
    }

    // Create new bar
    const bar = this.gameObject.scene.add.graphics();
    const tintColor = effect.tintColor ?? this.defaultColors[effect.type] ?? 0x888888;

    const effectBar: EffectBar = {
      effectType: effect.type,
      bar,
      tintColor
    };

    this.effectBars.push(effectBar);
    this.drawBar(effectBar, effect);
    this.updateAllBarPositions();
  }

  private onEffectRemoved(type: StatusEffectType): void {
    const index = this.effectBars.findIndex((b) => b.effectType === type);
    if (index !== -1) {
      const effectBar = this.effectBars[index]!;
      effectBar.bar.destroy();
      this.effectBars.splice(index, 1);
      this.updateAllBarPositions();
    }
  }

  private onEffectTick(effect: StatusEffectData): void {
    const effectBar = this.effectBars.find((b) => b.effectType === effect.type);
    if (effectBar) {
      this.drawBar(effectBar, effect);
    }
  }

  private drawBar(effectBar: EffectBar, effect: StatusEffectData): void {
    const { bar, tintColor } = effectBar;
    bar.clear();

    const { width, height } = this.getBarSize();
    const progress = effect.remainingTime / effect.duration;

    // Background (dark gray)
    bar.fillStyle(0x333333);
    bar.fillRect(0, 0, width, height);

    // Border
    bar.fillStyle(0x000000);
    bar.fillRect(0, 0, width, this.barBorder);
    bar.fillRect(0, height - this.barBorder, width, this.barBorder);
    bar.fillRect(0, 0, this.barBorder, height);
    bar.fillRect(width - this.barBorder, 0, this.barBorder, height);

    // Progress bar with tint color
    bar.fillStyle(tintColor);
    const filledWidth = Math.floor((width - 2 * this.barBorder) * progress);
    bar.fillRect(this.barBorder, this.barBorder, filledWidth, height - 2 * this.barBorder);
  }

  private getBarSize(): { width: number; height: number } {
    return { width: this.barWidth, height: this.barHeight };
  }

  private getBaseYOffset(): number {
    // Position below health/armor bars
    if (this.healthComponent) {
      const healthBounds = this.healthComponent.getHealthUiComponentBounds();
      return healthBounds.height + this.barSpacing;
    }
    return 0;
  }

  private updateAllBarPositions(): void {
    const bounds = getGameObjectBounds(this.gameObject);
    if (!bounds) return;

    this.barWidth = Math.max(Math.round(bounds.width / 3), 25);
    const baseX = bounds.centerX - this.barWidth / 2;
    const baseY = bounds.centerY - bounds.height / 2 + this.getBaseYOffset();
    const depth = this.getBarDepth();

    this.effectBars.forEach((effectBar, index) => {
      const y = baseY + index * (this.barHeight + this.barSpacing);
      effectBar.bar.setPosition(baseX, y);
      effectBar.bar.setDepth(depth);

      // Redraw bar with updated dimensions
      const effect = this.statusEffectComponent?.getEffect(effectBar.effectType);
      if (effect) {
        this.drawBar(effectBar, effect);
      }
    });
  }

  private getBarDepth(): number {
    return (getGameObjectDepth(this.gameObject) ?? 0) + OwnerComponent.ZIndex + HealthUiComponent.ZIndex + StatusEffectUiComponent.ZIndex;
  }

  private destroy(): void {
    this.effectBars.forEach((effectBar) => effectBar.bar.destroy());
    this.effectBars = [];
    this.actorMovedSubscription?.unsubscribe();
    this.effectAppliedSubscription?.unsubscribe();
    this.effectRemovedSubscription?.unsubscribe();
    this.effectTickSubscription?.unsubscribe();
  }

  setVisibility(visible: boolean): void {
    this.effectBars.forEach((effectBar) => effectBar.bar.setVisible(visible));
  }
}
