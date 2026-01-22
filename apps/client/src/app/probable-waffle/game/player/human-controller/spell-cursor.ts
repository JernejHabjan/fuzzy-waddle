import { GameObjects, Input } from 'phaser';
import { EventEmitter } from '@angular/core';
import { onSceneInitialized } from '../../data/game-object-helper';
import { SpellType } from '../../entity/components/combat/spell-type';
import { spellDefinitions } from '../../entity/components/combat/spell-definitions';
import { TilemapComponent } from '../../world/tilemap/tilemap.component';
import { getSceneComponent, getSceneService } from '../../world/services/scene-component-helpers';
import { NavigationService } from '../../world/services/navigation.service';
import type { Vector2Simple } from '@fuzzy-waddle/api-interfaces';
import GameProbableWaffleScene from '../../world/scenes/GameProbableWaffleScene';
import { SpellCastingSystem } from '../../entity/systems/spell-casting.system';
import { getActorSystem } from '../../data/actor-system';
import { SelectableComponent } from '../../entity/components/selectable-component';
import { getActorComponent } from '../../data/actor-component';
import { SpellComponent } from '../../entity/components/combat/components/spell-component';

export class SpellCursor {
  private aoeCircle?: GameObjects.Graphics;
  private rangeCircle?: GameObjects.Graphics;
  private spellType?: SpellType;
  private selectedCasters: Phaser.GameObjects.GameObject[] = [];
  private tileMapComponent?: TilemapComponent;
  private navigationService?: NavigationService;
  private escKey?: Phaser.Input.Keyboard.Key;
  private pointerLocation?: Vector2Simple;

  startCastingSpell = new EventEmitter<SpellType>();
  stopCastingSpell = new EventEmitter<void>();
  spellCast = new EventEmitter<{ spellType: SpellType; position: Vector2Simple }>();

  constructor(private scene: GameProbableWaffleScene) {
    this.startCastingSpell.subscribe((type) => this.activate(type));
    this.stopCastingSpell.subscribe(() => this.deactivate());
    this.scene.input.on(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.scene.input.on(Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    this.scene.input.on(Input.Events.GAME_OUT, this.deactivate, this);
    onSceneInitialized(scene, this.init, this);
    scene.onShutdown.subscribe(() => this.destroy());
    this.subscribeToCancelAction();
  }

  private init(): void {
    this.tileMapComponent = getSceneComponent(this.scene, TilemapComponent);
    this.navigationService = getSceneService(this.scene, NavigationService);
  }

  private subscribeToCancelAction(): void {
    this.escKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey?.on('down', this.deactivate, this);
  }

  get isCasting(): boolean {
    return this.spellType !== undefined;
  }

  activate(spellType: SpellType): void {
    if (this.spellType) {
      this.deactivate();
    }

    const spellData = spellDefinitions[spellType];
    if (!spellData) return;

    this.spellType = spellType;

    // Find selected casters that have this spell
    this.selectedCasters = this.findSelectedCastersWithSpell(spellType);
    if (this.selectedCasters.length === 0) {
      this.deactivate();
      return;
    }

    // Create AOE circle visualization
    this.createAoeCircle(spellData.aoeRadius, spellData.tintColor ?? 0x6666ff);

    // Create range circle (optional - shows max range)
    if (spellData.range > 0) {
      this.createRangeCircle(spellData.range, spellData.tintColor ?? 0x6666ff);
    }
  }

  deactivate(): void {
    this.spellType = undefined;
    this.selectedCasters = [];

    if (this.aoeCircle) {
      this.aoeCircle.destroy();
      this.aoeCircle = undefined;
    }

    if (this.rangeCircle) {
      this.rangeCircle.destroy();
      this.rangeCircle = undefined;
    }
  }

  private findSelectedCastersWithSpell(spellType: SpellType): Phaser.GameObjects.GameObject[] {
    const casters: Phaser.GameObjects.GameObject[] = [];

    for (const gameObject of this.scene.children.list) {
      const selectableComponent = getActorComponent(gameObject, SelectableComponent);
      if (!selectableComponent?.getSelected()) continue;

      const spellComponent = getActorComponent(gameObject, SpellComponent);
      if (!spellComponent) continue;

      if (spellComponent.availableSpells.includes(spellType)) {
        casters.push(gameObject);
      }
    }

    return casters;
  }

  private createAoeCircle(radiusTiles: number, color: number): void {
    this.aoeCircle = this.scene.add.graphics();
    const radiusPixels = radiusTiles * TilemapComponent.tileWidth;

    this.aoeCircle.fillStyle(color, 0.2);
    this.aoeCircle.fillCircle(0, 0, radiusPixels);

    this.aoeCircle.lineStyle(2, color, 0.6);
    this.aoeCircle.strokeCircle(0, 0, radiusPixels);

    this.aoeCircle.setDepth(1000);
    this.aoeCircle.setVisible(false);
  }

  private createRangeCircle(_rangeTiles: number, _color: number): void {
    // Range circle shows the maximum range from caster
    // Currently not drawn - could be added for more visual feedback
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isCasting || !this.aoeCircle) return;

    // Get world position from pointer
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    this.pointerLocation = { x: worldX, y: worldY };

    // Update AOE circle position
    this.aoeCircle.setPosition(worldX, worldY);
    this.aoeCircle.setVisible(true);

    // Check if position is in range
    const isInRange = this.isPositionInRange(this.pointerLocation);
    const color = this.getSpellColor();

    // Update circle color based on range validity
    this.aoeCircle.clear();
    const radiusPixels = this.getAoeRadiusPixels();

    if (isInRange) {
      this.aoeCircle.fillStyle(color, 0.2);
      this.aoeCircle.fillCircle(0, 0, radiusPixels);
      this.aoeCircle.lineStyle(2, color, 0.6);
    } else {
      // Red tint when out of range
      this.aoeCircle.fillStyle(0xff0000, 0.2);
      this.aoeCircle.fillCircle(0, 0, radiusPixels);
      this.aoeCircle.lineStyle(2, 0xff0000, 0.6);
    }
    this.aoeCircle.strokeCircle(0, 0, radiusPixels);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.isCasting || !this.spellType || pointer.button !== 0) return;

    const worldPos = { x: pointer.worldX, y: pointer.worldY };

    // Convert world position to tile position
    const tilePos = this.worldToTile(worldPos);
    if (!tilePos) return;

    // Check if position is in range
    if (!this.isPositionInRange(worldPos)) {
      // Could play error sound here
      return;
    }

    // Cast spell from each selected caster
    let castSuccess = false;
    for (const caster of this.selectedCasters) {
      const spellCastingSystem = getActorSystem(caster, SpellCastingSystem);
      if (spellCastingSystem) {
        const success = spellCastingSystem.castSpell(this.spellType, tilePos);
        if (success) {
          castSuccess = true;
        }
      }
    }

    if (castSuccess) {
      this.spellCast.emit({ spellType: this.spellType, position: tilePos });
    }

    // Deactivate cursor after cast (or keep active with shift key)
    const shiftKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    if (!shiftKey?.isDown) {
      this.deactivate();
    }
  }

  private isPositionInRange(worldPos: Vector2Simple): boolean {
    if (!this.spellType) return false;

    const spellData = spellDefinitions[this.spellType];
    if (!spellData) return false;

    const tilePos = this.worldToTile(worldPos);
    if (!tilePos) return false;

    // Check if any caster can reach this position
    for (const caster of this.selectedCasters) {
      const spellCastingSystem = getActorSystem(caster, SpellCastingSystem);
      if (spellCastingSystem?.isInRange(this.spellType, tilePos)) {
        return true;
      }
    }

    return false;
  }

  private worldToTile(worldPos: Vector2Simple): Vector2Simple | null {
    if (!this.navigationService) return null;
    return this.navigationService.worldToTile(worldPos);
  }

  private getAoeRadiusPixels(): number {
    if (!this.spellType) return 0;
    const spellData = spellDefinitions[this.spellType];
    if (!spellData) return 0;
    return spellData.aoeRadius * TilemapComponent.tileWidth;
  }

  private getSpellColor(): number {
    if (!this.spellType) return 0x6666ff;
    const spellData = spellDefinitions[this.spellType];
    return spellData?.tintColor ?? 0x6666ff;
  }

  private destroy(): void {
    this.deactivate();
    this.scene.input.off(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.scene.input.off(Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    this.scene.input.off(Input.Events.GAME_OUT, this.deactivate, this);
    this.escKey?.destroy();
  }
}
