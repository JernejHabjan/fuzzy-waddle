import Phaser from "phaser";
import {
  ProbableWaffleGameInstance,
  ProbableWaffleGameState,
  ProbableWafflePlayer,
  ProbableWafflePlayerController,
  ProbableWafflePlayerState,
  ProbableWafflePlayerType,
  createPlayerLobbyDefinition,
  type GameCommandAuthorityState
} from "@fuzzy-waddle/probable-waffle-protocol";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";

/** Headless native scene and real protocol players; only renderer/host plugins are omitted. */
export function commandBusTestScene(commandAuthority?: GameCommandAuthorityState): ProbableWaffleScene {
  const scene = new ProbableWaffleScene();
  const gameInstance = new ProbableWaffleGameInstance();
  gameInstance.gameInstanceMetadata.data.gameInstanceId = "authority-test";
  gameInstance.gameState = new ProbableWaffleGameState();
  gameInstance.gameState.data.commandAuthority = commandAuthority;
  gameInstance.players = [2, 3].map(
    (playerNumber) =>
      new ProbableWafflePlayer(
        new ProbableWafflePlayerState(),
        new ProbableWafflePlayerController({
          userId: `ai-${playerNumber}`,
          playerDefinition: {
            player: createPlayerLobbyDefinition(playerNumber),
            playerType: ProbableWafflePlayerType.AI
          }
        })
      )
  );
  Object.defineProperties(scene, {
    events: { value: new Phaser.Events.EventEmitter() },
    baseGameData: { value: { gameInstance, user: { userId: "host" } } }
  });
  return scene;
}
