import { EventEmitter } from '@angular/core';
import { SpellType } from '../spell-type';
import type { SpellData } from '../spell-data';
import { spellDefinitions } from '../spell-definitions';
import { type SpellComponentData } from '@fuzzy-waddle/api-interfaces';
import Phaser from 'phaser';
import { onObjectReady } from '../../../../data/game-object-helper';

export interface SpellDefinition {
  availableSpells: SpellType[];
}

export class SpellComponent {
  static readonly SpellCooldownStartedEvent = 'spellCooldownStarted';
  static readonly SpellCooldownEndedEvent = 'spellCooldownEnded';

  spellCooldownStarted: EventEmitter<SpellType> = new EventEmitter<SpellType>();
  spellCooldownEnded: EventEmitter<SpellType> = new EventEmitter<SpellType>();

  private spellCooldowns: Map<SpellType, number> = new Map();
  private autocastEnabled: Map<SpellType, boolean> = new Map();

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly spellDefinition: SpellDefinition
  ) {
    // Initialize autocast states from spell definitions
    for (const spellType of spellDefinition.availableSpells) {
      const spellData = spellDefinitions[spellType];
      if (spellData) {
        this.autocastEnabled.set(spellType, spellData.autocastDefault ?? true);
      }
    }

    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);

    onObjectReady(gameObject, this.init, this);
  }

  private init(): void {
    // Future initialization
  }

  private destroy(): void {
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  get availableSpells(): SpellType[] {
    return this.spellDefinition.availableSpells;
  }

  getSpellData(type: SpellType): SpellData | undefined {
    return spellDefinitions[type];
  }

  canCastSpell(type: SpellType): boolean {
    if (!this.spellDefinition.availableSpells.includes(type)) {
      return false;
    }

    const remainingCooldown = this.spellCooldowns.get(type) ?? 0;
    return remainingCooldown <= 0;
  }

  isSpellResearched(_type: SpellType): boolean {
    // TODO: Implement research check via TechTreeService
    // For now, return true to allow testing
    return true;
  }

  isAutocastEnabled(type: SpellType): boolean {
    return this.autocastEnabled.get(type) ?? false;
  }

  setAutocast(type: SpellType, enabled: boolean): void {
    this.autocastEnabled.set(type, enabled);
  }

  toggleAutocast(type: SpellType): void {
    const current = this.autocastEnabled.get(type) ?? false;
    this.autocastEnabled.set(type, !current);
  }

  startCooldown(type: SpellType): void {
    const spellData = spellDefinitions[type];
    if (spellData) {
      this.spellCooldowns.set(type, spellData.cooldown);
      this.spellCooldownStarted.emit(type);
      this.gameObject.emit(SpellComponent.SpellCooldownStartedEvent, type);
    }
  }

  getCooldownRemaining(type: SpellType): number {
    return this.spellCooldowns.get(type) ?? 0;
  }

  getCooldownProgress(type: SpellType): number {
    const spellData = spellDefinitions[type];
    if (!spellData) return 100;

    const remaining = this.spellCooldowns.get(type) ?? 0;
    if (remaining <= 0) return 100;

    return ((spellData.cooldown - remaining) / spellData.cooldown) * 100;
  }

  private update(_time: number, delta: number): void {
    if (!this.gameObject.active) return;

    // Tick down cooldowns
    for (const [spellType, remaining] of this.spellCooldowns.entries()) {
      if (remaining > 0) {
        const newRemaining = remaining - delta;
        if (newRemaining <= 0) {
          this.spellCooldowns.set(spellType, 0);
          this.spellCooldownEnded.emit(spellType);
          this.gameObject.emit(SpellComponent.SpellCooldownEndedEvent, spellType);
        } else {
          this.spellCooldowns.set(spellType, newRemaining);
        }
      }
    }
  }

  getData(): SpellComponentData {
    const cooldowns: Record<string, number> = {};
    const autocast: Record<string, boolean> = {};

    for (const [type, remaining] of this.spellCooldowns.entries()) {
      cooldowns[type] = remaining;
    }

    for (const [type, enabled] of this.autocastEnabled.entries()) {
      autocast[type] = enabled;
    }

    return {
      cooldowns,
      autocastEnabled: autocast
    };
  }

  setData(data: Partial<SpellComponentData>): void {
    if (data.cooldowns) {
      for (const [type, remaining] of Object.entries(data.cooldowns)) {
        this.spellCooldowns.set(type as SpellType, remaining);
      }
    }

    if (data.autocastEnabled) {
      for (const [type, enabled] of Object.entries(data.autocastEnabled)) {
        this.autocastEnabled.set(type as SpellType, enabled);
      }
    }
  }
}
