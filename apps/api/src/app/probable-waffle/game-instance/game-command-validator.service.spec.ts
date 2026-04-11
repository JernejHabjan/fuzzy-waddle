import { GameCommandValidatorService } from "./game-command-validator.service";
import type { ProbableWaffleGameCommandEvent, ProbableWaffleGameInstance } from "@fuzzy-waddle/api-interfaces";

describe("GameCommandValidatorService", () => {
  const service = new GameCommandValidatorService();

  function createGameInstance(): ProbableWaffleGameInstance {
    return {
      getPlayerByNumber: jest.fn().mockReturnValue({
        playerController: {
          data: {
            userId: "user-1"
          }
        }
      }),
      gameState: {
        data: {
          actors: [
            {
              id: { id: "actor-1" },
              owner: { ownerId: 1 },
              translatable: {}
            }
          ]
        }
      }
    } as unknown as ProbableWaffleGameInstance;
  }

  function createMoveEvent(worldX: number, worldY: number): ProbableWaffleGameCommandEvent {
    return {
      gameInstanceId: "gi-1",
      emitterUserId: "user-1",
      tick: 0,
      playerNumber: 1,
      commands: [
        {
          type: "MOVE",
          tick: 0,
          playerNumber: 1,
          actorIds: ["actor-1"],
          tileVec3: { x: 10, y: 10, z: 0 },
          worldVec3: { x: worldX, y: worldY, z: 0 },
          queue: false
        }
      ]
    };
  }

  it("accepts move commands with consistent tile and world coordinates", () => {
    expect(service.validate(createMoveEvent(640, 0), createGameInstance(), { id: "user-1" } as never)).toBe(true);
  });

  it("rejects move commands with inconsistent tile and world coordinates", () => {
    expect(service.validate(createMoveEvent(960, 0), createGameInstance(), { id: "user-1" } as never)).toBe(false);
  });
});
