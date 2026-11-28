import type Phaser from "phaser";
import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";

/** Optional campaign visibility metadata read from the host scene's players. */
export type SceneWithAiPlayers = Phaser.Scene & {
  baseGameData?: {
    gameInstance?: {
      players?: {
        playerNumber?: PlayerNumber;
        playerController: {
          data: { playerDefinition?: { campaignFogPolicy?: "normal" | "revealed" | "omniscient-ai" } };
        };
      }[];
    };
  };
};
