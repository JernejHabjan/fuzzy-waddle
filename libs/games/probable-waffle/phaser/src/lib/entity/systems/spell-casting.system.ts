import { SpellType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/spell-type";
import type { SpellData } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/spell-data";
import { spellDefinitions } from "../components/combat/spell-definitions";
import {
  type CastSpellCommand,
  DamageType,
  type GameCommandOutcome,
  type PendingSpellImpactData,
  ProbableWaffleGameCommandTypes,
  SpellTargetType,
  type StatusEffectData,
  StatusEffectType
} from "@fuzzy-waddle/probable-waffle-protocol";
import { type Vector2Simple, type Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { getActorComponent } from "../../data/actor-component";
import { SpellComponent } from "../components/combat/components/spell-component";
import { HealthComponent } from "../components/combat/components/health-component";
import { StatusEffectComponent } from "../components/status-effect/status-effect-component";
import { OwnerComponent } from "../components/owner-component";
import { ActorTranslateComponent } from "../components/movement/actor-translate-component";
import { AnimationActorComponent } from "../components/animation/animation-actor-component";
import {
  getGameObjectBounds,
  getGameObjectLogicalTransform,
  isWaterUnit,
  onObjectReady
} from "../../data/game-object-helper";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { AudioService } from "../../world/services/audio.service";
import { AoeZoneManager } from "./aoe-zone-manager";
import { NavigationService } from "../../world/services/navigation.service";
import { SceneActorCreator } from "../../world/services/scene-actor-creator";
import { DistanceHelper } from "../../library/distance-helper";
import { ProjectileType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/projectile-type";
import { DepthHelper } from "../../world/services/depth.helper";
import { IsoHelper } from "../../world/tilemap/iso-helper";
import Phaser from "phaser";
import { PhaserProjectileFactory } from "../../combat/phaser-projectile-factory";
import type { Subscription } from "rxjs";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import { SummonExpiryService } from "./summon-expiry.service";
import { getPlayerRelation } from "../../data/player-relation";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { FlyingComponent } from "../components/movement/flying-component";

export class SpellCastingSystem {
  private spellComponent?: SpellComponent;
  private actorTranslateComponent?: ActorTranslateComponent;
  private animationActorComponent?: AnimationActorComponent;
  private ownerComponent?: OwnerComponent;
  private audioService?: AudioService;
  private aoeZoneManager?: AoeZoneManager;
  private navigationService?: NavigationService;
  private projectileSprite?: Phaser.GameObjects.Image;
  private projectileTween?: Phaser.Tweens.Tween;
  private commandSubscription?: Subscription;
  private impactTickSubscription?: Subscription;

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    onObjectReady(gameObject, this.init, this);
  }

  private init(): void {
    this.spellComponent = getActorComponent(this.gameObject, SpellComponent);
    this.actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    this.animationActorComponent = getActorComponent(this.gameObject, AnimationActorComponent);
    this.ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
    this.aoeZoneManager = getSceneService(this.gameObject.scene, AoeZoneManager);
    this.navigationService = getSceneService(this.gameObject.scene, NavigationService);
    const commandBus = getSceneService(this.gameObject.scene, CommandBusService);
    this.commandSubscription = commandBus?.command$.subscribe((command) => {
      if (command.type !== ProbableWaffleGameCommandTypes.CastSpell) return;
      const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
      if (!actorId || !command.actorIds.includes(actorId)) return;
      this.applyCastCommand(command, actorId);
    });
    this.impactTickSubscription = getSceneService(this.gameObject.scene, SimulationTickService)?.tick$.subscribe(
      (tick) => this.applyDueImpacts(tick)
    );
  }

  private destroy(): void {
    this.stopProjectile();
    if (this.gameObject.scene.sys.isActive()) {
      const tick = getSceneService(this.gameObject.scene, SimulationTickService)?.currentTick ?? 0;
      const commandBus = getSceneService(this.gameObject.scene, CommandBusService);
      for (const impact of this.spellComponent?.takeDueImpacts(Number.MAX_SAFE_INTEGER) ?? []) {
        commandBus?.reportPersistedOutcome(this.outcomeFromImpact(impact, tick, false));
      }
    }
    this.commandSubscription?.unsubscribe();
    this.impactTickSubscription?.unsubscribe();
  }

  canCastSpell(spellType: SpellType): boolean {
    if (!this.spellComponent) return false;

    const spellData = spellDefinitions[spellType];
    if (!spellData) return false;

    // Check if spell is available to this caster
    if (!this.spellComponent.availableSpells.includes(spellType)) {
      return false;
    }

    // Check if spell is researched
    if (!this.spellComponent.isSpellResearched(spellType)) {
      return false;
    }

    // Check cooldown
    // noinspection RedundantIfStatementJS
    if (!this.spellComponent.canCastSpell(spellType)) {
      return false;
    }

    return true;
  }

  isInRange(spellType: SpellType, targetTileXYZ: Vector3Simple): boolean {
    const spellData = spellDefinitions[spellType];
    if (!spellData) return false;

    const casterTransform = getGameObjectLogicalTransform(this.gameObject);
    if (!casterTransform) return false;

    const distance = DistanceHelper.getTileDistanceBetweenGameObjectAndTile(this.gameObject, targetTileXYZ);
    return distance !== null && distance <= spellData.range;
  }

  castSpell(spellType: SpellType, targetTileXYZ: Vector3Simple, command?: CastSpellCommand): boolean {
    if (!this.canCastSpell(spellType)) {
      return false;
    }

    const spellData = spellDefinitions[spellType];
    if (!spellData) return false;

    // Check range
    if (!this.isInRange(spellType, targetTileXYZ)) {
      return false;
    }

    // Turn towards target
    const worldXY = this.navigationService?.getTileWorldCenter(targetTileXYZ);
    if (this.actorTranslateComponent && worldXY) {
      this.actorTranslateComponent.turnTowardsPosition(worldXY);
    }

    // Play cast animation
    if (this.animationActorComponent && spellData.castAnimation) {
      this.animationActorComponent.playCustomAnimation(spellData.castAnimation, {
        forceRestart: true
      });
    }

    // Play cast sound
    if (this.audioService && spellData.sounds?.cast) {
      // TODO #647: Play cast sound
    }

    const effectId = command?.execution?.effectId ?? command?.execution?.commandId ?? `spell:${spellType}`;
    // Projectile gameplay is scheduled on simulation ticks; the tween is presentation only.
    if (spellData.projectile) {
      const flightDurationMs = this.spawnProjectile(spellData, targetTileXYZ);
      const tickService = getSceneService(this.gameObject.scene, SimulationTickService);
      const casterId = getActorComponent(this.gameObject, IdComponent)?.id;
      if (flightDurationMs === null || !tickService || !command?.execution || !this.spellComponent || !casterId) {
        return false;
      }
      this.spellComponent.enqueueImpact({
        effectId,
        commandId: command.execution.commandId,
        commitmentKey: command.execution.commitmentKey,
        playerNumber: command.playerNumber,
        authorityEpoch: command.execution.authorityEpoch,
        sequence: command.execution.sequence,
        ...(command.execution.intentId ? { intentId: command.execution.intentId } : {}),
        casterIds: [casterId],
        spellType,
        targetObjectId: command.targetObjectId,
        targetTile: targetTileXYZ,
        dueTick:
          tickService.currentTick +
          Math.max(1, Math.ceil(flightDurationMs / SimulationTickService.TICK_INTERVAL_MS))
      });
    } else {
      // Instant cast - apply effects immediately
      if (!this.applySpellEffects(spellData, targetTileXYZ, command)) return false;
    }

    // Start cooldown
    if (this.spellComponent) {
      this.spellComponent.startCooldown(spellType);
    }

    return true;
  }

  private applyCastCommand(command: CastSpellCommand, actorId: string): void {
    const commandBus = getSceneService(this.gameObject.scene, CommandBusService)!;
    const spellType = command.spellType as SpellType;
    if (!this.spellComponent?.availableSpells.includes(spellType)) {
      commandBus.reportOutcome(command, "rejected", "unsupported_action", [actorId]);
      return;
    }
    if (!this.spellComponent.canCastSpell(spellType)) {
      commandBus.reportOutcome(command, "rejected", "cooldown_active", [actorId]);
      return;
    }
    if (!this.isValidCommandTarget(command, actorId, spellDefinitions[spellType])) {
      commandBus.reportOutcome(command, "rejected", "invalid_target", [actorId]);
      return;
    }
    if (!this.castSpell(spellType, command.tileVec3, command)) {
      commandBus.reportOutcome(command, "rejected", "invalid_target", [actorId]);
      return;
    }
    const effectId = command.execution?.effectId ?? command.execution?.commandId ?? "spell";
    commandBus.reportOutcome(command, "applied", "applied", [actorId], [effectId]);
    commandBus.reportOutcome(
      command,
      spellDefinitions[spellType]?.projectile ? "active" : "completed",
      "applied",
      [actorId],
      [effectId]
    );
  }

  private applyDueImpacts(tick: number): void {
    const impacts = this.spellComponent?.takeDueImpacts(tick) ?? [];
    const commandBus = getSceneService(this.gameObject.scene, CommandBusService);
    for (const impact of impacts) {
      const spellData = spellDefinitions[impact.spellType as SpellType];
      const targetWorld = this.navigationService?.getTileWorldCenter(impact.targetTile);
      const applied =
        !!spellData &&
        !!targetWorld &&
        this.onProjectileImpact(spellData, impact.targetTile, targetWorld, impact.targetObjectId);
      commandBus?.reportPersistedOutcome(this.outcomeFromImpact(impact, tick, applied));
    }
  }

  private outcomeFromImpact(impact: PendingSpellImpactData, tick: number, applied: boolean): GameCommandOutcome {
    return {
      schemaVersion: 1,
      kind: applied ? "completed" : "failed",
      reason: applied ? "applied" : "application_failed",
      tick,
      playerNumber: impact.playerNumber,
      commandId: impact.commandId,
      commitmentKey: impact.commitmentKey,
      authorityEpoch: impact.authorityEpoch,
      sequence: impact.sequence,
      ...(impact.intentId ? { intentId: impact.intentId } : {}),
      effectId: impact.effectId,
      actorIds: [...impact.casterIds],
      worldLinkIds: [impact.effectId]
    };
  }

  private spawnProjectile(spellData: SpellData, targetPosition: Vector2Simple): number | null {
    const projectile = spellData.projectile;
    if (!projectile) return null;

    const position = getGameObjectBounds(this.gameObject);
    if (!position) return null;

    // Convert target tile position to world position
    const targetWorld = this.navigationService?.getTileWorldCenter(targetPosition);
    if (!targetWorld) return null;

    // Create projectile sprite
    const projectileSprite =
      PhaserProjectileFactory.create(this.gameObject.scene, projectile.type) ??
      PhaserProjectileFactory.create(this.gameObject.scene, ProjectileType.FrostBoltProjectile); // Default to frost bolt

    if (!projectileSprite) return null;

    this.projectileSprite = projectileSprite;
    this.gameObject.scene.add.existing(projectileSprite);
    projectileSprite.setOrigin(0.5, 0.5);
    DepthHelper.setActorDepth(this.gameObject);

    // Check spawn behavior config (default to 'launch')
    const spawnBehavior = projectile.spawnBehavior ?? { type: "launch" };

    if (spawnBehavior.type === "fall") {
      // Projectile falls from above target
      const spawnOffsetY = spawnBehavior.spawnOffsetY ?? -200; // Default 200 pixels above
      projectileSprite.setPosition(targetWorld.x, targetWorld.y + spawnOffsetY);

      // Set rotation to point downward
      if (!projectile.orientation.randomizeOrientation) {
        projectileSprite.setRotation(Phaser.Math.DegToRad(90)); // Point straight down
      }

      // Calculate flight time based on vertical distance
      const projectileSpeed = projectile.speed;
      const distance = Math.abs(spawnOffsetY);
      const duration = (distance / projectileSpeed) * 1000;

      // Animate projectile falling straight down
      this.projectileTween = this.gameObject.scene.tweens.add({
        targets: projectileSprite,
        y: targetWorld.y,
        duration: duration,
        ease: spawnBehavior.ease ?? "Cubic.easeIn", // Default to gravity-like acceleration
        onComplete: () => {
          this.stopProjectile();
        }
      });
      return duration;
    } else {
      // Normal projectile behavior - launch from caster to target
      projectileSprite.setPosition(position.centerX, position.centerY);

      // Calculate flight time
      const projectileSpeed = projectile.speed;
      const distance = Phaser.Math.Distance.Between(position.centerX, position.centerY, targetWorld.x, targetWorld.y);
      const duration = (distance / projectileSpeed) * 1000;

      // Rotate projectile towards target
      if (!projectile.orientation.randomizeOrientation) {
        const angle = Phaser.Math.Angle.Between(position.centerX, position.centerY, targetWorld.x, targetWorld.y);
        projectileSprite.setRotation(angle);
      }

      // Animate projectile flight
      this.projectileTween = this.gameObject.scene.tweens.add({
        targets: projectileSprite,
        x: targetWorld.x,
        y: targetWorld.y,
        duration: duration,
        ease: spawnBehavior.ease ?? "Linear", // Default to linear movement
        onComplete: () => {
          this.stopProjectile();
        }
      });
      return duration;
    }
  }

  private onProjectileImpact(
    spellData: SpellData,
    targetTilePosition: Vector2Simple,
    targetWorldPosition: Vector2Simple,
    targetObjectId?: string
  ): boolean {
    if (!Number.isFinite(targetWorldPosition.x) || !Number.isFinite(targetWorldPosition.y)) return false;
    // Play impact animation
    if (spellData.projectile?.impactAnimation) {
      // TODO #648: Create impact animation at target position
    }

    // Play impact sound
    if (this.audioService && spellData.sounds?.impact) {
      // TODO #649: Play impact sound
    }

    // Apply spell effects
    return this.applySpellEffects(spellData, targetTilePosition, undefined, targetObjectId);
  }

  private applySpellEffects(
    spellData: SpellData,
    targetPosition: Vector2Simple,
    command?: CastSpellCommand,
    targetObjectId?: string
  ): boolean {
    // Handle persistent zone spells
    if (spellData.persistentZone) {
      return this.createPersistentZone(spellData, targetPosition);
    }

    // Handle spawn prefab spells
    if (spellData.spawnPrefab) {
      return this.spawnPrefab(spellData, targetPosition, command);
    }

    // Find actors in AOE
    const addressedTargetId = command?.targetObjectId ?? targetObjectId;
    const affectedActors = this.findActorsInAoe(spellData, targetPosition, addressedTargetId);
    if (addressedTargetId && affectedActors.length === 0) return false;

    // Apply effects to each affected actor
    for (const actor of affectedActors) {
      this.applyEffectsToActor(spellData, actor);
    }
    return true;
  }

  private findActorsInAoe(
    spellData: SpellData,
    targetPosition: Vector2Simple,
    targetObjectId?: string
  ): Phaser.GameObjects.GameObject[] {
    const actors: Phaser.GameObjects.GameObject[] = [];
    const casterPlayerId = this.ownerComponent?.getOwner();

    if (targetObjectId) {
      const target = getSceneService(this.gameObject.scene, ActorIndexSystem)?.getActorById(targetObjectId);
      if (!target) return actors;
      if (!this.isActorInSupportedDomain(target, spellData)) return actors;
      const targetOwner = getActorComponent(target, OwnerComponent)?.getOwner();
      const relation = getPlayerRelation(this.gameObject.scene, casterPlayerId, targetOwner);
      const isSelf = target === this.gameObject;
      const isAlly = relation === "self" || relation === "ally";
      if (isSelf && !spellData.targetSelf) return actors;
      if (isAlly && !isSelf && !spellData.targetAllies) return actors;
      if (relation === "enemy" && !spellData.targetEnemies) return actors;
      if (relation === "neutral") return actors;
      return getActorComponent(target, HealthComponent)?.alive ? [target] : actors;
    }

    // Convert AOE radius from tiles to world pixels (approximate)
    const aoeRadiusPixels = spellData.aoeRadius * 64; // Approximate tile size

    // Convert target position to world position
    const targetWorld = this.navigationService?.getTileWorldCenter(targetPosition);
    if (!targetWorld) return actors;

    // Iterate through all game objects
    for (const gameObject of this.gameObject.scene.children.list) {
      const healthComponent = getActorComponent(gameObject, HealthComponent);
      if (!healthComponent || !healthComponent.alive) continue;
      if (!this.isActorInSupportedDomain(gameObject, spellData)) continue;

      // Get actor position
      const actorBounds = getGameObjectBounds(gameObject);
      if (!actorBounds) continue;

      // Check distance from target position
      const distance = Phaser.Math.Distance.Between(
        targetWorld.x,
        targetWorld.y,
        actorBounds.centerX,
        actorBounds.centerY
      );

      if (distance > aoeRadiusPixels) continue;

      // Check ally/enemy targeting
      const actorOwner = getActorComponent(gameObject, OwnerComponent);
      const actorPlayerId = actorOwner?.getOwner();
      const relation = getPlayerRelation(this.gameObject.scene, casterPlayerId, actorPlayerId);
      const isAlly = relation === "self" || relation === "ally";
      const isSelf = gameObject === this.gameObject;

      if (isSelf && !spellData.targetSelf) continue;
      if (isAlly && !isSelf && !spellData.targetAllies) continue;
      if (relation === "enemy" && !spellData.targetEnemies) continue;
      if (relation === "neutral") continue;

      actors.push(gameObject);
    }

    return actors;
  }

  private applyEffectsToActor(spellData: SpellData, target: Phaser.GameObjects.GameObject): void {
    const healthComponent = getActorComponent(target, HealthComponent);
    const statusEffectComponent = getActorComponent(target, StatusEffectComponent);

    // Apply instant damage
    if (spellData.instantDamage && healthComponent && spellData.damageType !== undefined) {
      healthComponent.takeDamage(spellData.instantDamage, spellData.damageType, this.gameObject);
    }

    // Apply instant heal
    if (spellData.instantHeal && healthComponent) {
      healthComponent.heal(spellData.instantHeal);
    }

    // Apply DoT effect
    if (spellData.dotDamage && spellData.dotDuration && statusEffectComponent) {
      const dotEffect: StatusEffectData = {
        type: this.getDotEffectType(spellData),
        duration: spellData.dotDuration,
        remainingTime: spellData.dotDuration,
        damagePerTick: spellData.dotDamage,
        tickInterval: spellData.dotTickInterval ?? 1000,
        damageType: spellData.damageType,
        tintColor: spellData.tintColor
      };
      statusEffectComponent.applyEffect(dotEffect);
    }

    // Apply HoT effect
    if (spellData.hotHeal && spellData.hotDuration && statusEffectComponent) {
      const hotEffect: StatusEffectData = {
        type: StatusEffectType.Regenerating,
        duration: spellData.hotDuration,
        remainingTime: spellData.hotDuration,
        healPerTick: spellData.hotHeal,
        tickInterval: spellData.hotTickInterval ?? 1000,
        tintColor: spellData.tintColor
      };
      statusEffectComponent.applyEffect(hotEffect);
    }

    // Apply stun effect
    if (spellData.stunDuration && statusEffectComponent) {
      const stunEffect: StatusEffectData = {
        type: this.getStunEffectType(spellData),
        duration: spellData.stunDuration,
        remainingTime: spellData.stunDuration,
        tintColor: spellData.tintColor
      };
      statusEffectComponent.applyEffect(stunEffect);
    }

    // Apply slow effect
    if (spellData.slowDuration && spellData.slowAmount && statusEffectComponent) {
      const slowEffect: StatusEffectData = {
        type: StatusEffectType.Slowed,
        duration: spellData.slowDuration,
        remainingTime: spellData.slowDuration,
        movementSpeedModifier: spellData.slowAmount,
        tintColor: spellData.tintColor
      };
      statusEffectComponent.applyEffect(slowEffect);
    }
  }

  private isValidCommandTarget(command: CastSpellCommand, actorId: string, spellData?: SpellData): boolean {
    if (!spellData) return false;
    if (spellData.targetType === SpellTargetType.Ground) return command.targetObjectId === undefined;
    const targetId = spellData.targetType === SpellTargetType.Self ? actorId : command.targetObjectId;
    if (!targetId) return false;
    const actorIndex = getSceneService(this.gameObject.scene, ActorIndexSystem);
    const target = actorIndex?.getActorById(targetId);
    if (!target || !target.active || !getActorComponent(target, HealthComponent)?.alive) return false;
    if (!this.isActorInSupportedDomain(target, spellData)) return false;
    if (!actorIndex?.getActorsAtTile(command.tileVec3).includes(target)) return false;
    const relation = getPlayerRelation(
      this.gameObject.scene,
      this.ownerComponent?.getOwner(),
      getActorComponent(target, OwnerComponent)?.getOwner()
    );
    if (spellData.targetType === SpellTargetType.Self && target !== this.gameObject) return false;
    if (spellData.targetType === SpellTargetType.EnemyUnit && relation !== "enemy") return false;
    if (spellData.targetType === SpellTargetType.FriendlyUnit && relation !== "self" && relation !== "ally") {
      return false;
    }
    if (relation === "neutral") return false;
    if (target === this.gameObject) return spellData.targetSelf;
    if (relation === "self" || relation === "ally") return spellData.targetAllies;
    return spellData.targetEnemies;
  }

  private isActorInSupportedDomain(target: Phaser.GameObjects.GameObject, spellData: SpellData): boolean {
    if (!spellData.targetDomains || spellData.targetDomains.length === 0) return true;
    const domain = getActorComponent(target, FlyingComponent) ? "air" : isWaterUnit(target) ? "water" : "land";
    return spellData.targetDomains.includes(domain);
  }

  private getDotEffectType(spellData: SpellData): StatusEffectType {
    switch (spellData.damageType) {
      case DamageType.Fire:
        return StatusEffectType.Burning;
      case DamageType.Poison:
        return StatusEffectType.Poisoned;
      case DamageType.Frost:
        return StatusEffectType.Frozen;
      default:
        return StatusEffectType.Burning;
    }
  }

  private getStunEffectType(spellData: SpellData): StatusEffectType {
    switch (spellData.damageType) {
      case DamageType.Frost:
        return StatusEffectType.Frozen;
      case DamageType.Fire:
        return StatusEffectType.Burning;
      default:
        return StatusEffectType.Stunned;
    }
  }

  private createPersistentZone(spellData: SpellData, targetPosition: Vector2Simple): boolean {
    if (!spellData.persistentZone || !this.aoeZoneManager) return false;

    const targetWorld = this.navigationService?.getTileWorldCenter(targetPosition);
    if (!targetWorld) return false;

    // Create the status effect that will be applied while inside the zone
    const zoneEffectDuration = Math.max(
      spellData.persistentZone.tickInterval,
      spellData.dotDuration ?? spellData.hotDuration ?? spellData.persistentZone.tickInterval
    );
    const effectWhileInside: StatusEffectData = {
      type: spellData.targetEnemies ? StatusEffectType.Burning : StatusEffectType.Regenerating,
      duration: zoneEffectDuration,
      remainingTime: zoneEffectDuration,
      damagePerTick: spellData.dotDamage,
      healPerTick: spellData.hotHeal,
      tickInterval: spellData.dotTickInterval ?? spellData.hotTickInterval ?? 1000,
      tintColor: spellData.tintColor
    };

    this.aoeZoneManager.createZone({
      spellType: spellData.type,
      worldPosition: targetWorld,
      radius: spellData.aoeRadius,
      duration: spellData.persistentZone.duration,
      tickInterval: spellData.persistentZone.tickInterval,
      effectWhileInside,
      affectsAllies: spellData.targetAllies,
      affectsEnemies: spellData.targetEnemies,
      visualEffect: spellData.persistentZone.visualEffect,
      tintColor: spellData.tintColor,
      sourcePlayerId: this.ownerComponent?.getOwner() ?? -1
    });
    return true;
  }

  private spawnPrefab(spellData: SpellData, targetPosition: Vector2Simple, command?: CastSpellCommand): boolean {
    if (!spellData.spawnPrefab) return false;

    const sceneActorCreator = getSceneService(this.gameObject.scene, SceneActorCreator);
    if (!sceneActorCreator) {
      console.error("SceneActorCreator not found");
      return false;
    }

    // Convert tile position to world position
    const worldPosition = IsoHelper.isometricTileToWorldXY(this.gameObject.scene, targetPosition.x, targetPosition.y);
    const position: Vector3Simple = {
      x: worldPosition.x,
      y: worldPosition.y,
      z: 0
    };

    // Get owner if inheritOwner is set
    const ownerId =
      spellData.spawnPrefab.inheritOwner && this.ownerComponent ? this.ownerComponent.getOwner() : undefined;

    // Spawn the prefab using helper
    let newGameObject: Phaser.GameObjects.GameObject | undefined;
    try {
      newGameObject = sceneActorCreator.createFinishedActor(spellData.spawnPrefab.prefabName, position, ownerId);
    } catch {
      return false;
    }
    if (!newGameObject) return false;

    const duration = spellData.spawnPrefab.duration;
    const actorId = newGameObject ? getActorComponent(newGameObject, IdComponent)?.id : undefined;
    const tickService = getSceneService(this.gameObject.scene, SimulationTickService);
    const expiryService = getSceneService(this.gameObject.scene, SummonExpiryService);
    if (duration && actorId && tickService && expiryService) {
      const commandId = command?.execution?.commandId ?? `summon:${actorId}`;
      expiryService.register({
        actorId,
        effectId: command?.execution?.effectId ?? commandId,
        commandId,
        dueTick: tickService.currentTick + Math.max(1, Math.ceil(duration / SimulationTickService.TICK_INTERVAL_MS))
      });
    }
    return true;
  }

  private stopProjectile(): void {
    if (this.projectileTween) {
      this.projectileTween.stop();
      this.projectileTween = undefined;
    }
    if (this.projectileSprite) {
      this.projectileSprite.destroy();
      this.projectileSprite = undefined;
    }
  }
}
