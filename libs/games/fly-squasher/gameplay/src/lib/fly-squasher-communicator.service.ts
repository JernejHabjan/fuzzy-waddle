import { TwoWayCommunicator } from "@fuzzy-waddle/platform-game-host/communicators/two-way-communicator";
import { type FlySquasherCommunicatorScoreEvent, FlySquasherGatewayEvent } from "@fuzzy-waddle/fly-squasher-protocol";
import { type FlySquasherCommunicatorType } from "@fuzzy-waddle/fly-squasher-protocol";
import type { CommunicatorService } from "@fuzzy-waddle/platform-game-host/communicators/CommunicatorService";

export const flySquasherCommunicatorServiceStub = {
  startCommunication: () => {},
  stopCommunication: () => {}
};

export class FlySquasherCommunicatorService implements CommunicatorService {
  score?: TwoWayCommunicator<FlySquasherCommunicatorScoreEvent, FlySquasherCommunicatorType>;

  startCommunication() {
    this.score = new TwoWayCommunicator<FlySquasherCommunicatorScoreEvent, FlySquasherCommunicatorType>(
      FlySquasherGatewayEvent.FlySquasherAction,
      "score"
    );
  }

  stopCommunication() {
    this.score?.destroy();
  }
}
