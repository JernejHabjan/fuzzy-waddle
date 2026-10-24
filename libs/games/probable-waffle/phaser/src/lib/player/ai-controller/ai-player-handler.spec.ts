import { Subject } from "rxjs";
import { ProbableWafflePlayerType } from "@fuzzy-waddle/probable-waffle-protocol";
import type GameProbableWaffleScene from "../../world/scenes/GameProbableWaffleScene";
import { PlayerAiController } from "./player-ai-controller";
import { AiPlayerHandler } from "./ai-player-handler";

jest.mock("./player-ai-controller", () => ({
  PlayerAiController: jest.fn().mockImplementation((_scene, player) => ({
    player,
    setEnabled: jest.fn(),
    setAuthorityActive: jest.fn(),
    setSaveState: jest.fn()
  }))
}));

describe("AiPlayerHandler campaign composition", () => {
  beforeEach(() => jest.clearAllMocks());
  it("creates strategic controllers only for full AI participants and can pause them", () => {
    const onShutdown = new Subject<void>();
    const onDestroy = new Subject<void>();
    const player = (playerNumber: number, campaignController?: "full-ai" | "scripted-ai" | "passive") => ({
      playerNumber,
      playerState: { data: {} },
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
    const controller = handler.getAiPlayerController(1)!;
    expect(controller).toBeDefined();
    expect(controller.setEnabled).toHaveBeenCalledWith(true);
    expect(handler.getAiPlayerController(2)).toBeUndefined();
    expect(handler.setPlayerEnabled(1, false)).toBe(true);
    expect(handler.getAiPlayerController(1)?.setEnabled).toHaveBeenCalledWith(false);
    expect(handler.setPlayerEnabled(2, false)).toBe(false);
    onShutdown.next();
    expect(handler.getAiPlayerController(1)).toBeUndefined();
    expect(controller.setAuthorityActive).toHaveBeenCalledWith(false);
  });

  it("suspends a demoted host without mutating AI policy and resumes a promoted host once", () => {
    const onShutdown = new Subject<void>();
    const onDestroy = new Subject<void>();
    const player = {
      playerNumber: 2,
      playerState: { data: {} },
      playerController: { data: { playerDefinition: {
        playerType: ProbableWafflePlayerType.AI, campaignAiEnabled: true
      } } }
    };
    const scene = { isHost: true, players: [player], onShutdown, onDestroy } as unknown as GameProbableWaffleScene;
    const handler = new AiPlayerHandler(scene);
    const controller = handler.getAiPlayerController(2)!;
    const initialSetEnabledCalls = (controller.setEnabled as jest.Mock).mock.calls.length;

    handler.setHostAuthorityActive(false);
    expect(controller.setAuthorityActive).toHaveBeenLastCalledWith(false);
    expect(controller.setEnabled).toHaveBeenCalledTimes(initialSetEnabledCalls);
    expect(player.playerController.data.playerDefinition.campaignAiEnabled).toBe(true);

    handler.setHostAuthorityActive(true);
    expect(PlayerAiController).toHaveBeenCalledTimes(1);
    expect(controller.setAuthorityActive).toHaveBeenLastCalledWith(true);

    const peerScene = { ...scene, isHost: false } as GameProbableWaffleScene;
    const promoted = new AiPlayerHandler(peerScene);
    expect(promoted.getAiPlayerController(2)).toBeUndefined();
    promoted.setHostAuthorityActive(true);
    expect(promoted.getAiPlayerController(2)).toBeDefined();
    expect(PlayerAiController).toHaveBeenCalledTimes(2);
    onDestroy.next();
    expect(controller.setAuthorityActive).toHaveBeenLastCalledWith(false);
    expect(handler.getAiPlayerController(2)).toBeUndefined();
  });

  it("restores the actual reconnect-owned continuation once when a peer becomes host", () => {
    const continuation = { blackboard: { original: true }, controllerCadence: {
      schemaVersion: 1, elapsedMilliseconds: 950, queuedAfterBoundary: false, completedDecisionSequence: 17 } };
    const player = { playerNumber: 3, playerState: { data: { aiBehaviorTreeState: continuation } },
      playerController: { data: { playerDefinition: { playerType: ProbableWafflePlayerType.AI, campaignAiEnabled: true } } } };
    const scene = { isHost: false, players: [player], onShutdown: new Subject<void>(), onDestroy: new Subject<void>()
    } as unknown as GameProbableWaffleScene;
    const handler = new AiPlayerHandler(scene);
    handler.setHostAuthorityActive(true);
    const controller = handler.getAiPlayerController(3)!;
    expect(controller.setSaveState).toHaveBeenCalledWith(continuation);
    expect((controller.setSaveState as jest.Mock).mock.calls[0][0]).not.toBe(continuation);
    handler.setHostAuthorityActive(true);
    expect(controller.setSaveState).toHaveBeenCalledTimes(1);
    expect(controller.setAuthorityActive).toHaveBeenLastCalledWith(true);
  });
});
