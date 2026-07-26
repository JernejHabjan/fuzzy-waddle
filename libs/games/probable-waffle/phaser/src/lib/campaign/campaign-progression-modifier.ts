import Phaser from "phaser";
import type {
  CampaignProgressionModifier,
  CampaignProgressionModifierStat,
  FactionType,
  ObjectNames
} from "@fuzzy-waddle/probable-waffle-protocol";
import { ProbableWafflePlayerType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../data/actor-component";
import { getPlayer } from "../data/scene-data";
import { OwnerComponent } from "../entity/components/owner-component";
import type { ProbableWaffleScene } from "../core/probable-waffle.scene";

/** Documents the apply campaign progression modifiers member and its declared contract at this boundary. */
export function applyCampaignProgressionModifiers(
  gameObject: Phaser.GameObjects.GameObject,
  stat: CampaignProgressionModifierStat,
  baseValue: number
): number {
  const campaignState = (gameObject.scene as ProbableWaffleScene).baseGameData.gameInstance.gameState?.data
    .campaignMission;
  const modifiers = campaignState?.progression?.effectiveLoadout.modifiers ?? [];
  const owner = getActorComponent(gameObject, OwnerComponent)?.getOwner();
  const player = owner === undefined ? undefined : getPlayer(gameObject.scene, owner);
  if (player?.playerController.data.playerDefinition?.playerType !== ProbableWafflePlayerType.Human) return baseValue;
  const faction = player.factionType;
  let result = baseValue;
  for (const modifier of modifiers.filter(
    (candidate) => candidate.stat === stat && scopeMatches(candidate.scope, gameObject.name as ObjectNames, faction)
  )) {
    result = modifier.operation === "add" ? result + modifier.value : result * modifier.value;
  }
  return result;
}

function scopeMatches(
  scope: CampaignProgressionModifier["scope"],
  objectName: ObjectNames,
  faction: FactionType | undefined
): boolean {
  if (!scope || scope.kind === "global") return true;
  if (scope.kind === "actor") return scope.objectName === objectName;
  return scope.faction === faction;
}
