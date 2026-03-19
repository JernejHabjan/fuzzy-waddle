import { GameObjects, Input } from "phaser";
import { EventEmitter } from "@angular/core";
import { SpellType } from "../../entity/components/combat/spell-type";
import { spellDefinitions } from "../../entity/components/combat/spell-definitions";
import { TilemapComponent } from "../../world/tilemap/tilemap.component";
import type { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import GameProbableWaffleScene from "../../world/scenes/GameProbableWaffleScene";
import { SpellCastingSystem } from "../../entity/systems/spell-casting.system";
import { getActorSystem } from "../../data/actor-system";
import { SelectableComponent } from "../../entity/components/selectable-component";
import { getActorComponent } from "../../data/actor-component";
import { SpellComponent } from "../../entity/components/combat/components/spell-component";
import { IsoHelper } from "../../world/tilemap/iso-helper";
import { DistanceHelper } from "../../library/distance-helper";
import { SceneActorCreator } from "../../world/services/scene-actor-creator";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { getPwActorDefinition } from "../../prefabs/definitions/actor-definitions";
import { OwnerComponent } from "../../entity/components/owner-component";
import { Subscription } from "rxjs";

export class SpellCursor {
  private aoeCircle?: GameObjects.Graphics;
  private rangeCircle?: GameObjects.Graphics;
  private spellType?: SpellType;
  private selectedCasters: Phaser.GameObjects.GameObject[] = [];
  private escKey?: Phaser.Input.Keyboard.Key;
  private externalModalOpen: boolean = false;
  private externalModalSubscription?: Subscription;

  startCastingSpell = new EventEmitter<SpellType>();
  stopCastingSpell = new EventEmitter<void>();
  spellCast = new EventEmitter<{ spellType: SpellType; tileXYZ: Vector3Simple }>();

  constructor(private scene: GameProbableWaffleScene) {
    this.startCastingSpell.subscribe((type) => this.activate(type));
    this.stopCastingSpell.subscribe(() => this.deactivate());
    this.scene.input.on(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.scene.input.on(Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    this.scene.input.on(Input.Events.GAME_OUT, this.deactivate, this);
    scene.onShutdown.subscribe(() => this.destroy());
    this.subscribeToCancelAction();
    this.subscribeToExternalModalEvents();
  }

  private subscribeToExternalModalEvents(): void {
    // Listen to chat modal state changes
    this.externalModalSubscription = this.scene.communicator.allScenes.subscribe((event) => {
      if (event.name === "external-modal-opened") {
        this.externalModalOpen = true;
      } else if (event.name === "external-modal-closed") {
        this.externalModalOpen = false;
      }
    });
  }

  private subscribeToCancelAction(): void {
    this.escKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey?.on("down", this.deactivate, this);
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
    // Don't process keyboard events if external modal is open
    if (this.externalModalOpen) return;

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

    // Use ellipse for isometric perspective
    // Phaser's fillEllipse/strokeEllipse use width/height (diameter), not radius
    const ellipseWidth = radiusPixels * 2;
    const ellipseHeight = radiusPixels * 2 * 0.5; // Compressed for isometric

    this.aoeCircle.fillStyle(color, 0.2);
    this.aoeCircle.fillEllipse(0, 0, ellipseWidth, ellipseHeight);

    this.aoeCircle.lineStyle(2, color, 0.6);
    this.aoeCircle.strokeEllipse(0, 0, ellipseWidth, ellipseHeight);

    this.aoeCircle.setDepth(1000);
    this.aoeCircle.setVisible(false);
  }

  private createRangeCircle(rangeTiles: number, color: number): void {
    // Range circle shows the maximum range from caster
    this.rangeCircle = this.scene.add.graphics();
    const rangePixels = rangeTiles * TilemapComponent.tileWidth;

    // Use ellipse for isometric perspective - thin line
    // Phaser's strokeEllipse uses width/height (diameter), not radius
    const ellipseWidth = rangePixels * 2;
    const ellipseHeight = rangePixels * 2 * 0.5; // Compressed for isometric

    this.rangeCircle.lineStyle(2, color, 0.4);
    this.rangeCircle.strokeEllipse(0, 0, ellipseWidth, ellipseHeight);

    this.rangeCircle.setDepth(999); // Below AOE circle
    this.rangeCircle.setVisible(false);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isCasting || !this.aoeCircle) return;

    // Get world position from pointer
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    const worldPosition = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const clickedTileXY = IsoHelper.isometricWorldToTileXY(this.scene, worldPosition.x, worldPosition.y, false);
    const clickedTileXYZ = {
      ...clickedTileXY,
      z: 0
    } satisfies Vector3Simple;

    // Update AOE circle position
    this.aoeCircle.setPosition(worldX, worldY);
    this.aoeCircle.setVisible(true);

    // Update range circle position to nearest caster
    if (this.rangeCircle) {
      const nearestCaster = this.findNearestCaster(clickedTileXYZ);
      if (nearestCaster) {
        this.rangeCircle.setPosition(nearestCaster.x, nearestCaster.y);
        this.rangeCircle.setVisible(true);
      } else {
        this.rangeCircle.setVisible(false);
      }
    }

    // Check if position is in range
    const isInRange = this.isPositionInRange(clickedTileXYZ);
    const color = this.getSpellColor();

    // Update circle color based on range validity
    this.aoeCircle.clear();
    const radiusPixels = this.getAoeRadiusPixels();
    const ellipseWidth = radiusPixels * 2;
    const ellipseHeight = radiusPixels * 2 * 0.5; // Compressed for isometric

    if (isInRange) {
      this.aoeCircle.fillStyle(color, 0.2);
      this.aoeCircle.fillEllipse(0, 0, ellipseWidth, ellipseHeight);
      this.aoeCircle.lineStyle(2, color, 0.6);
    } else {
      // Red tint when out of range
      this.aoeCircle.fillStyle(0xff0000, 0.2);
      this.aoeCircle.fillEllipse(0, 0, ellipseWidth, ellipseHeight);
      this.aoeCircle.lineStyle(2, 0xff0000, 0.6);
    }
    this.aoeCircle.strokeEllipse(0, 0, ellipseWidth, ellipseHeight);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.isCasting || !this.spellType || pointer.button !== 0) return;

    // convert pointerXY to worldXY including camera zoom
    const worldPosition = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const clickedTileXY = IsoHelper.isometricWorldToTileXY(this.scene, worldPosition.x, worldPosition.y, false);
    if (!clickedTileXY) return;

    const clickedTileXYZ = {
      ...clickedTileXY,
      z: 0
    } satisfies Vector3Simple;

    // Check if position is in range
    if (!this.isPositionInRange(clickedTileXYZ)) {
      // Could play error sound here // todo
      return;
    }

    const spellData = spellDefinitions[this.spellType];
    if (!spellData) return;

    // Check if this spell spawns a prefab (e.g., HealingTotem)
    if (spellData.spawnPrefab) {
      this.handleSpawnPrefab(clickedTileXYZ, spellData);
      return;
    }

    // Cast spell from each selected caster
    let castSuccess = false;
    for (const caster of this.selectedCasters) {
      const spellCastingSystem = getActorSystem(caster, SpellCastingSystem);
      if (spellCastingSystem) {
        const success = spellCastingSystem.castSpell(this.spellType, clickedTileXYZ);
        if (success) {
          castSuccess = true;
        }
      }
    }

    if (castSuccess) {
      this.spellCast.emit({ spellType: this.spellType, tileXYZ: clickedTileXYZ });
    }

    // Deactivate cursor after cast (or keep active with shift key)
    const shiftKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    if (!shiftKey?.isDown) {
      this.deactivate();
    }
  }

  private handleSpawnPrefab(tileXYZ: Vector3Simple, spellData: (typeof spellDefinitions)[SpellType]): void {
    if (!spellData.spawnPrefab) return;

    const { prefabName, inheritOwner } = spellData.spawnPrefab;
    const prefabDefinition = getPwActorDefinition(prefabName, null);
    if (!prefabDefinition) {
      console.error(`Prefab definition not found: ${prefabName}`);
      return;
    }

    // Get owner from first caster
    let ownerId: number | undefined;
    if (inheritOwner && this.selectedCasters.length > 0) {
      const firstCaster = this.selectedCasters[0];
      if (firstCaster) {
        const ownerComponent = getActorComponent(firstCaster, OwnerComponent);
        ownerId = ownerComponent?.getData().ownerId;
      }
    }

    // Convert tile position to world position
    const worldPos = IsoHelper.isometricTileToWorldXY(this.scene, tileXYZ.x, tileXYZ.y);
    const position: Vector3Simple = {
      x: worldPos.x,
      y: worldPos.y,
      z: tileXYZ.z
    };

    // Spawn the prefab using helper
    const sceneActorCreator = getSceneService(this.scene, SceneActorCreator);
    if (!sceneActorCreator) {
      console.error("SceneActorCreator not found");
      return;
    }

    const newGameObject = sceneActorCreator.createFinishedActor(prefabName, position, ownerId);
    if (newGameObject) {
      // Start cooldown on caster
      if (this.selectedCasters.length > 0 && this.spellType) {
        const firstCaster = this.selectedCasters[0];
        if (firstCaster) {
          const spellComponent = getActorComponent(firstCaster, SpellComponent);
          spellComponent?.startCooldown(this.spellType);
        }
      }

      this.spellCast.emit({ spellType: this.spellType!, tileXYZ });
    }

    // Deactivate cursor after spawn (or keep active with shift key)
    const shiftKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    if (!shiftKey?.isDown) {
      this.deactivate();
    }
  }

  private isPositionInRange(tileXYZ: Vector3Simple): boolean {
    if (!this.spellType) return false;

    const spellData = spellDefinitions[this.spellType];
    if (!spellData) return false;

    // Check if any caster can reach this position
    for (const caster of this.selectedCasters) {
      const spellCastingSystem = getActorSystem(caster, SpellCastingSystem);
      if (spellCastingSystem?.isInRange(this.spellType, tileXYZ)) {
        return true;
      }
    }

    return false;
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

  private findNearestCaster(
    tileXYZ: Vector3Simple
  ): (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform) | null {
    if (this.selectedCasters.length === 0) return null;

    let nearestCaster: (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform) | null = null;
    let minDistance = Infinity;

    for (const caster of this.selectedCasters) {
      const distance = DistanceHelper.getTileDistanceBetweenGameObjectAndTile(caster, tileXYZ);
      if (distance !== null && distance < minDistance) {
        minDistance = distance;
        nearestCaster = caster as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform;
      }
    }

    return nearestCaster;
  }

  private destroy(): void {
    this.deactivate();
    this.scene.input.off(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.scene.input.off(Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    this.scene.input.off(Input.Events.GAME_OUT, this.deactivate, this);
    this.escKey?.destroy();
    this.externalModalSubscription?.unsubscribe();
  }
}
