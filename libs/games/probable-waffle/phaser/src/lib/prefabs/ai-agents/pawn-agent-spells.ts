import Phaser from "phaser";
import { State } from "mistreevous";
import { getActorComponent } from "../../data/actor-component";
import { VisionComponent } from "../../entity/components/vision-component";
import { getActorSystem } from "../../data/actor-system";
import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { SpellTargetType } from "@fuzzy-waddle/probable-waffle-protocol";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { SpellComponent } from "../../entity/components/combat/components/spell-component";
import { SpellCastingSystem } from "../../entity/systems/spell-casting.system";
import { spellDefinitions } from "../../entity/components/combat/spell-definitions";
import { NavigationService } from "../../world/services/navigation.service";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { OwnerComponent } from "../../entity/components/owner-component";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";

/** Owns autocast target selection and shared spell command dispatch.
 * Actor-local collaborators own no subscriptions, timers or saved state; the controller owns their lifetime.
 */
export class PawnAgentSpells {
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject
  ) {}

  HasSpellComponent(): boolean {
    return !!getActorComponent(this.gameObject, SpellComponent);
  }

  HasAutocastSpellReady(): boolean {
    const spellComponent = getActorComponent(this.gameObject, SpellComponent);
    if (!spellComponent) return false;

    const spellCastingSystem = getActorSystem(this.gameObject, SpellCastingSystem);
    if (!spellCastingSystem) return false;

    for (const spellType of spellComponent.availableSpells) {
      if (!spellComponent.isAutocastEnabled(spellType)) continue;
      if (!spellComponent.isSpellResearched(spellType)) continue;
      if (!spellComponent.canCastSpell(spellType)) continue;

      // Check if we have a valid target for this spell
      const spellData = spellDefinitions[spellType];
      if (!spellData) continue;

      if (this.hasValidAutocastTarget(spellData.targetType)) {
        return true;
      }
    }

    return false;
  }

  private hasValidAutocastTarget(targetType: SpellTargetType): boolean {
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent) return false;

    switch (targetType) {
      case SpellTargetType.Ground:
      case SpellTargetType.EnemyUnit:
        // For offensive spells, need visible enemy
        return visionComponent.getVisibleEnemies().length > 0;
      case SpellTargetType.FriendlyUnit:
      case SpellTargetType.Self:
        // For healing spells, need visible damaged friendly
        const visibleFriendlies = visionComponent.getVisibleFriendlies();
        return visibleFriendlies.some((friendly) => {
          const healthComponent = getActorComponent(friendly, HealthComponent);
          return healthComponent && !healthComponent.healthIsFull && healthComponent.alive;
        });
      default:
        return false;
    }
  }

  CastAutocastSpell(): State {
    const spellComponent = getActorComponent(this.gameObject, SpellComponent);
    if (!spellComponent) return State.FAILED;

    const spellCastingSystem = getActorSystem(this.gameObject, SpellCastingSystem);
    if (!spellCastingSystem) return State.FAILED;

    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent) return State.FAILED;

    for (const spellType of spellComponent.availableSpells) {
      if (!spellComponent.isAutocastEnabled(spellType)) continue;
      if (!spellComponent.isSpellResearched(spellType)) continue;
      if (!spellComponent.canCastSpell(spellType)) continue;

      const spellData = spellDefinitions[spellType];
      if (!spellData) continue;

      // Find target position based on spell target type
      let targetPosition: Vector3Simple | null = null;
      let targetObjectId: string | undefined;
      const navigationService = getSceneService(this.gameObject.scene, NavigationService);

      switch (spellData.targetType) {
        case SpellTargetType.EnemyUnit:
        case SpellTargetType.Ground:
          // For offensive spells, target closest enemy position
          const enemy = visionComponent.getClosestVisibleEnemy();
          if (enemy) {
            const enemyTile = navigationService?.getCenterTileCoordUnderObject(enemy);
            if (enemyTile) targetPosition = { ...enemyTile, z: 0 };
            targetObjectId = getActorComponent(enemy, IdComponent)?.id;
          }
          break;
        case SpellTargetType.FriendlyUnit:
          // Find damaged friendly
          const friendlies = visionComponent.getVisibleFriendlies();
          for (const friendly of friendlies) {
            const healthComponent = getActorComponent(friendly, HealthComponent);
            const friendlyTile = navigationService?.getCenterTileCoordUnderObject(friendly);
            if (healthComponent && !healthComponent.healthIsFull && healthComponent.alive && friendlyTile) {
              targetPosition = { ...friendlyTile, z: 0 };
              targetObjectId = getActorComponent(friendly, IdComponent)?.id;
              break;
            }
          }
          break;
        case SpellTargetType.Self:
          const selfTile = navigationService?.getCenterTileCoordUnderObject(this.gameObject);
          if (selfTile) targetPosition = { ...selfTile, z: 0 };
          targetObjectId = getActorComponent(this.gameObject, IdComponent)?.id;
          break;
      }

      if (!targetPosition) continue;

      // Cast the spell
      const commandBus = getSceneService(this.gameObject.scene, CommandBusService);
      const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
      const ownerId = getActorComponent(this.gameObject, OwnerComponent)?.getData().ownerId;
      if (!commandBus || !actorId || ownerId === undefined) continue;
      const receipt = commandBus.dispatch({
        type: "CAST_SPELL",
        playerNumber: ownerId,
        actorIds: [actorId],
        spellType,
        targetObjectId,
        tileVec3: targetPosition
      });
      if (receipt.status === "dispatched") {
        return State.SUCCEEDED;
      }
    }

    return State.FAILED;
  }

}
