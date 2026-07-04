import { EventEmitter } from "@angular/core";
import type { Subscription } from "rxjs";
import { SpellType } from "../spell-type";
import type { SpellData } from "../spell-data";
import { spellDefinitions } from "../spell-definitions";
import { type SpellComponentData } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";
import { isGameObjectActiveInActiveScene, onObjectReady } from "../../../../data/game-object-helper";
import { getActorComponent } from "../../../../data/actor-component";
import { OwnerComponent } from "../../owner-component";
import { getSceneService } from "../../../../world/services/scene-component-helpers";
import { TechTreeService } from "../../../../data/tech-tree/tech-tree.service";
import { SimulationTickService } from "../../../../world/services/simulation-tick.service";

export interface SpellDefinition {
  availableSpells: SpellType[];
}

export class SpellComponent {
  static readonly SpellCooldownStartedEvent = "spellCooldownStarted";
  static readonly SpellCooldownEndedEvent = "spellCooldownEnded";

  spellCooldownStarted: EventEmitter<SpellType> = new EventEmitter<SpellType>();
  spellCooldownEnded: EventEmitter<SpellType> = new EventEmitter<SpellType>();

  private spellCooldowns: Map<SpellType, number> = new Map();
  private autocastEnabled: Map<SpellType, boolean> = new Map();
  private ownerComponent?: OwnerComponent;
  private techTreeService?: TechTreeService;
  private cooldownTickSub?: Subscription;
  private simulationTickService?: SimulationTickService;
  private cooldownStartedTickBySpell = new Map<SpellType, number>();

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
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);

    onObjectReady(gameObject, this.init, this);
  }

  private init(): void {
    this.ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    this.techTreeService = getSceneService(this.gameObject.scene, TechTreeService);
    this.simulationTickService = getSceneService(this.gameObject.scene, SimulationTickService);
    this.cooldownTickSub = this.simulationTickService?.tick$.subscribe(() => {
      this.onSimulationTick();
    });
  }

  private destroy(): void {
    this.cooldownTickSub?.unsubscribe();
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

  isSpellResearched(type: SpellType): boolean {
    const spellData = spellDefinitions[type];
    if (!spellData || !spellData.requiresResearch) {
      // No research required, spell is always available
      return true;
    }

    if (!this.techTreeService || !this.ownerComponent) {
      // Services not available yet, assume not researched
      return false;
    }

    const ownerData = this.ownerComponent.getData();
    if (ownerData.ownerId === undefined) {
      return false;
    }

    return this.techTreeService.isResearched(ownerData.ownerId, spellData.requiresResearch);
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
      const currentTick = this.simulationTickService?.currentTick;
      if (currentTick !== undefined) {
        this.cooldownStartedTickBySpell.set(type, currentTick);
      } else {
        this.cooldownStartedTickBySpell.delete(type);
      }
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

  private onSimulationTick(): void {
    if (!isGameObjectActiveInActiveScene(this.gameObject)) return;
    const deltaWithTimeScale = SimulationTickService.TICK_INTERVAL_MS;
    const currentTick = this.simulationTickService?.currentTick;

    // Tick down cooldowns
    for (const [spellType, remaining] of this.spellCooldowns.entries()) {
      if (remaining > 0) {
        if (currentTick !== undefined && this.cooldownStartedTickBySpell.get(spellType) === currentTick) {
          continue;
        }
        const newRemaining = remaining - deltaWithTimeScale;
        if (newRemaining <= 0) {
          this.spellCooldowns.set(spellType, 0);
          this.cooldownStartedTickBySpell.delete(spellType);
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
      const currentTick = this.simulationTickService?.currentTick;
      for (const [type, remaining] of Object.entries(data.cooldowns)) {
        const spellType = type as SpellType;
        this.spellCooldowns.set(spellType, remaining);
        // Fixes spell cooldown desync by aligning restored cooldown start with the current simulation tick.
        if (remaining > 0 && currentTick !== undefined) {
          this.cooldownStartedTickBySpell.set(spellType, currentTick);
        } else {
          this.cooldownStartedTickBySpell.delete(spellType);
        }
      }
    }

    if (data.autocastEnabled) {
      for (const [type, enabled] of Object.entries(data.autocastEnabled)) {
        this.autocastEnabled.set(type as SpellType, enabled);
      }
    }
  }
}
