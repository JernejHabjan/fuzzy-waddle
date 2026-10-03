import type Phaser from "phaser";
import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { ProbableWafflePlayer } from "@fuzzy-waddle/probable-waffle-protocol";

type SceneWithPlayers = Phaser.Scene & {
  baseGameData?: { gameInstance?: { players?: ProbableWafflePlayer[] } };
};

export type PlayerRelation = "self" | "ally" | "enemy" | "neutral";

/** Resolves authored teams without treating neutral/unowned actors as enemies. */
export function getPlayerRelation(
  scene: Phaser.Scene,
  sourcePlayer: PlayerNumber | undefined,
  targetPlayer: PlayerNumber | undefined
): PlayerRelation {
  if (sourcePlayer === undefined || targetPlayer === undefined) return "neutral";
  if (sourcePlayer === targetPlayer) return "self";
  const players = (scene as SceneWithPlayers).baseGameData?.gameInstance?.players ?? [];
  const source = players.find((player) => player.playerNumber === sourcePlayer);
  const target = players.find((player) => player.playerNumber === targetPlayer);
  if (!source || !target) return "neutral";
  const sourceTeam = source.playerController.data.playerDefinition?.team ?? sourcePlayer;
  const targetTeam = target.playerController.data.playerDefinition?.team ?? targetPlayer;
  return sourceTeam === targetTeam ? "ally" : "enemy";
}

export function arePlayersAllied(
  scene: Phaser.Scene,
  sourcePlayer: PlayerNumber | undefined,
  targetPlayer: PlayerNumber | undefined
): boolean {
  const relation = getPlayerRelation(scene, sourcePlayer, targetPlayer);
  return relation === "self" || relation === "ally";
}
