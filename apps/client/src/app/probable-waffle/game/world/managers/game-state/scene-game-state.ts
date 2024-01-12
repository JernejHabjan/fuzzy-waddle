import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { GameSessionState } from "@fuzzy-waddle/api-interfaces";

export class MapObject {
  // todo
}

export class SceneGameState {
  private sessionStateSubscription?: { unsubscribe(): void };
  constructor(private readonly scene: ProbableWaffleScene) {
    scene.onDestroy.subscribe(() => this.destroy());
    scene.onPostCreate.subscribe(() => this.listen());
  }

  private listen() {
    this.pauseUntilAllPlayersAreReady();

    console.log("playing level", this.scene.mapInfo.name);

    // after 3 seconds, change state to StartingTheGame
    setTimeout(() => {
      this.scene.baseGameData.communicator.gameInstanceMetadataChanged?.send({
        property: "sessionState",
        gameInstanceId: this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.gameInstanceId!,
        data: { sessionState: GameSessionState.StartingTheGame },
        emitterUserId: this.scene.baseGameData.user.userId
      });
    }, 100); // todo for test - later call this when all players have loaded the game
  }

  pauseUntilAllPlayersAreReady() {
    this.handleCurrentSessionState(this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.sessionState!);
    this.sessionStateSubscription = this.scene.baseGameData.communicator.gameInstanceMetadataChanged?.on.subscribe(
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
      case GameSessionState.StartingTheGame:
        const sendInProgress = () => {
          this.scene.baseGameData.communicator.gameInstanceMetadataChanged?.send({
            property: "sessionState",
            gameInstanceId: this.scene.gameInstanceId,
            data: { sessionState: GameSessionState.InProgress },
            emitterUserId: this.scene.userId
          });
        };
        const handleCountdown = false;
        if (handleCountdown) {
          setTimeout(() => sendInProgress(), 3000);
        } else {
          sendInProgress();
        }

        break;
      case GameSessionState.InProgress:
        this.scene.scene.resume();
        break;
      case GameSessionState.ToScoreScreen:
        this.scene.scene.stop();
        break;
      case GameSessionState.Stopped:
        throw new Error("HUD should be destroyed at this point");
    }
  }

  private destroy() {
    this.sessionStateSubscription?.unsubscribe();
  }
}
