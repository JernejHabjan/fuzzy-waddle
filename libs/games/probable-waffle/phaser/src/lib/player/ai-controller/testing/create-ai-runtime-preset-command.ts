import type Phaser from "phaser";
import { ProbableWaffleGameCommandTypes, OrderType, type GameCommandInput } from "@fuzzy-waddle/probable-waffle-protocol";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { RepresentableComponent } from "../../../entity/components/representable-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { IsoHelper } from "../../../world/tilemap/iso-helper";
import { NavigationService } from "../../../world/services/navigation.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import type { AiRuntimePresetControlV1 } from "./ai-runtime-preset-control-v1";

/** Translate explicit fixture controls to the same native commands used by human players; never apply effects here. */
export function createAiRuntimePresetCommand(
  scene: ProbableWaffleScene, fixtureId: string, control: AiRuntimePresetControlV1,
  actors: ReadonlyMap<string, Phaser.GameObjects.GameObject>, producer: Phaser.GameObjects.GameObject,
  actorId: string, owner: number, setupItem?: UnifiedQueueItem
): GameCommandInput {
  const action = control.action;
  let command: GameCommandInput;
  if (action.kind === "unload") {
    command = {
      type: ProbableWaffleGameCommandTypes.Unload, playerNumber: owner, actorIds: [actorId],
      tileVec3: { ...IsoHelper.isometricWorldToTileXY(scene, action.worldPosition.x, action.worldPosition.y),
        z: action.worldPosition.z }
    };
  } else if (action.kind === "board") {
    const target = actors.get(action.targetFixtureActorId);
    const id = target && getActorComponent(target, IdComponent)?.id;
    if (!target?.active || target.scene !== scene || !id ||
        getActorComponent(target, OwnerComponent)?.getOwner() !== owner)
      throw new Error(`runtime_preset_control_board_target_missing:${control.id}`);
    command = { type: ProbableWaffleGameCommandTypes.ActorAction, playerNumber: owner, actorIds: [actorId],
      targetObjectIds: [id], orderType: OrderType.EnterContainer, queue: false };
  } else if (action.kind === "construct") {
    command = {
      type: ProbableWaffleGameCommandTypes.Construct, playerNumber: owner, actorIds: [actorId],
      actorName: action.actorName, siteKey: `runtime:${fixtureId}:control:${control.id}`,
      tileVec3: { ...IsoHelper.isometricWorldToTileXY(scene, action.worldPosition.x, action.worldPosition.y),
        z: action.worldPosition.z }
    };
  } else if (action.kind === "cast") {
    const target = actors.get(action.targetFixtureActorId);
    const id = target && getActorComponent(target, IdComponent)?.id, tile = target && getGameObjectCurrentTile(target);
    if (!target?.active || target.scene !== scene || !id || !tile || getActorComponent(target, HealthComponent)?.killed)
      throw new Error(`runtime_preset_control_spell_target_missing:${control.id}`);
    command = {
      type: ProbableWaffleGameCommandTypes.CastSpell, playerNumber: owner, actorIds: [actorId],
      spellType: action.spellType, targetObjectId: id, tileVec3: { ...tile, z: 0 }
    };
  } else if (action.kind === "move_to_actor") {
    const target = actors.get(action.targetFixtureActorId);
    const tile = target && getGameObjectCurrentTile(target);
    const position = tile && getSceneService(scene, NavigationService)?.getTileWorldCenter(tile);
    if (!target?.active || target.scene !== scene || !tile || !position ||
        getActorComponent(target, OwnerComponent)?.getOwner() !== owner) {
      throw new Error(`runtime_preset_control_move_target_missing:${control.id}`);
    }
    command = {
      type: ProbableWaffleGameCommandTypes.Move, playerNumber: owner, actorIds: [actorId],
      tileVec3: { ...tile, z: 0 }, worldVec3: { ...position, z: 0 }, queue: false
    };
  } else if (action.kind === "move") {
    command = {
      type: ProbableWaffleGameCommandTypes.Move, playerNumber: owner, actorIds: [actorId],
      tileVec3: { ...IsoHelper.isometricWorldToTileXY(scene, action.worldPosition.x, action.worldPosition.y),
        z: action.worldPosition.z },
      worldVec3: { ...action.worldPosition }, queue: false
    };
  } else if (action.kind === "attack") {
    const target = actors.get(action.targetFixtureActorId);
    const id = target && getActorComponent(target, IdComponent)?.id;
    const targetOwner = target && getActorComponent(target, OwnerComponent)?.getOwner();
    if (!target?.active || target.scene !== scene || !id || targetOwner === undefined || targetOwner === owner ||
        getActorComponent(target, HealthComponent)?.killed) {
      throw new Error(`runtime_preset_control_attack_target_missing:${control.id}`);
    }
    command = {
      type: ProbableWaffleGameCommandTypes.ActorAction, playerNumber: owner, actorIds: [actorId],
      targetObjectIds: [id], orderType: OrderType.Attack, queue: false
    };
  } else if (action.kind === "rally") {
    const target = actors.get(action.targetFixtureActorId);
    const targetId = target && getActorComponent(target, IdComponent)?.id;
    const position = target && getActorComponent(target, RepresentableComponent)?.logicalWorldTransform;
    const tile = target && getGameObjectCurrentTile(target);
    if (
      !target?.active ||
      !targetId ||
      !position ||
      !tile ||
      getActorComponent(target, OwnerComponent)?.getOwner() !== owner
    ) {
      throw new Error(`runtime_preset_control_rally_target_missing:${control.id}`);
    }
    command = {
      type: ProbableWaffleGameCommandTypes.SetRallyPoint,
      playerNumber: owner,
      actorIds: [actorId],
      targetObjectId: targetId,
      tileVec3: { ...tile, z: position.z },
      worldVec3: position
    };
  } else if (action.kind === "produce") {
    command = {
      type: ProbableWaffleGameCommandTypes.Production,
      playerNumber: owner,
      actorIds: [actorId],
      actorName: action.actorName
    };
  } else {
    if (!setupItem) throw new Error(`runtime_preset_control_paid_item_missing:${control.id}`);
    const index = getActorComponent(producer, QueueComponent)?.allItems.indexOf(setupItem);
    if (index === undefined || index < 0) throw new Error(`runtime_preset_control_paid_item_lost:${control.id}`);
    command = {
      type: ProbableWaffleGameCommandTypes.CancelProduction,
      playerNumber: owner,
      actorIds: [actorId],
      queueIndex: index
    };
  }
  return command;
}
