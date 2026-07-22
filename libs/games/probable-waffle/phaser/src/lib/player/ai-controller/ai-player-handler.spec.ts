import { Subject } from "rxjs";
import { ProbableWafflePlayerType } from "@fuzzy-waddle/probable-waffle-protocol";
import type GameProbableWaffleScene from "../../world/scenes/GameProbableWaffleScene";
import { PlayerAiController } from "./player-ai-controller";
import { AiPlayerHandler } from "./ai-player-handler";

jest.mock("./player-ai-controller", () => ({
  PlayerAiController: jest.fn().mockImplementation((_scene, player) => ({
    player,
    setEnabled: jest.fn()
  }))
}));

describe("AiPlayerHandler campaign composition", () => {
  it("creates strategic controllers only for full AI participants and can pause them", () => {
    const onShutdown = new Subject<void>();
    const onDestroy = new Subject<void>();
    const player = (playerNumber: number, campaignController?: "full-ai" | "scripted-ai" | "passive") => ({
      playerNumber,
      playerController: {
        data: {
          playerDefinition: {
            playerType: ProbableWafflePlayerType.AI,
            campaignController
          }
        }
      }
    });
    const scene = {
      isHost: true,
      players: [player(1, "full-ai"), player(2, "scripted-ai"), player(3, "passive")],
      onShutdown,
      onDestroy
    } as unknown as GameProbableWaffleScene;

    const handler = new AiPlayerHandler(scene);

    expect(PlayerAiController).toHaveBeenCalledTimes(1);
    expect(handler.getAiPlayerController(1)).toBeDefined();
    expect(handler.getAiPlayerController(1)?.setEnabled).toHaveBeenCalledWith(true);
    expect(handler.getAiPlayerController(2)).toBeUndefined();
    expect(handler.setPlayerEnabled(1, false)).toBe(true);
    expect(handler.getAiPlayerController(1)?.setEnabled).toHaveBeenCalledWith(false);
    expect(handler.setPlayerEnabled(2, false)).toBe(false);
    onShutdown.next();
    expect(handler.getAiPlayerController(1)).toBeUndefined();
  });
});
