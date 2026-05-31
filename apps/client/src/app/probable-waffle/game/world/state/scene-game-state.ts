import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { GameSessionState, ProbableWaffleGameInstanceType } from "@fuzzy-waddle/api-interfaces";
import { getCommunicator } from "../../data/scene-data";
import { ReadyBarrier } from "../services/multiplayer/ready-barrier.service";

export class SceneGameState {
  private sessionStateSubscription?: { unsubscribe(): void };
  constructor(private readonly scene: ProbableWaffleScene) {
    scene.onShutdown.subscribe(() => this.destroy());
    scene.onPostCreate.subscribe(() => this.listen());
  }

  private listen() {
    this.pauseUntilAllPlayersAreReady();

    // ReadyBarrier signals when all human players have loaded.
    // Every client constructs the barrier so non-host peers emit their ready signal.
    // Only the host callback advances the shared session state; peers just wait.
    new ReadyBarrier(this.scene, () => {
      if (!this.scene.isHost) {
        return;
      }

      getCommunicator(this.scene).gameInstanceMetadataChanged?.send({
        property: "sessionState",
        gameInstanceId: this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.gameInstanceId!,
        data: { sessionState: GameSessionState.StartingTheGame },
        emitterUserId: this.scene.baseGameData.user.userId
      });
    });
  }

  pauseUntilAllPlayersAreReady() {
    this.handleCurrentSessionState(this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.sessionState!);
    this.sessionStateSubscription = getCommunicator(this.scene).gameInstanceMetadataChanged?.on.subscribe(
      (metadataEvent) => {
        switch (metadataEvent.property) {
          case "sessionState":
            this.handleCurrentSessionState(metadataEvent.data.sessionState!);
            break;
        }
      }
    );
  }

  private handleCurrentSessionState(sessionState: GameSessionState) {
    switch (sessionState) {
      case GameSessionState.NotStarted:
        throw new Error("Game should not be in this state " + sessionState);
      case GameSessionState.MovingPlayersToGame:
        this.scene.scene.pause();
        break;
      case GameSessionState.StartingTheGame: {
        // Only the host advances to InProgress — non-host clients wait for the
        // host's broadcast via the gameInstanceMetadataChanged subscription.
        // This avoids every client sending the same state transition independently.
        if (!this.scene.isHost) {
          break;
        }
        const sendInProgress = () => {
          getCommunicator(this.scene).gameInstanceMetadataChanged?.send({
            property: "sessionState",
            gameInstanceId: this.scene.gameInstanceId,
            data: { sessionState: GameSessionState.InProgress },
            emitterUserId: this.scene.userId
          });
        };
        // In multiplayer the 3-second window lets all clients finish loading before
        // the simulation starts. For local-only modes there are no remote peers so
        // we advance immediately rather than making the player wait needlessly.
        const type = this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.type;
        const isNetworked =
          type === ProbableWaffleGameInstanceType.Matchmaking ||
          type === ProbableWaffleGameInstanceType.SelfHosted;
        if (isNetworked) {
          setTimeout(() => sendInProgress(), 3000);
        } else {
          sendInProgress();
        }
        break;
      }
      case GameSessionState.InProgress:
        this.scene.scene.resume();
        break;
      case GameSessionState.ToScoreScreen:
        this.scene.scene.stop();
        break;
      case GameSessionState.Stopped:
        const sceneExists = this.scene.scene.scene;
        if (sceneExists) this.scene.scene.stop();
    }
  }

  private destroy() {
    this.sessionStateSubscription?.unsubscribe();
  }
}
