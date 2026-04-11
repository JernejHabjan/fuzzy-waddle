import { GameCommandValidatorService } from "./game-command-validator.service";
import type { ProbableWaffleGameCommandEvent, ProbableWaffleGameInstance } from "@fuzzy-waddle/api-interfaces";

describe("GameCommandValidatorService", () => {
  let service: GameCommandValidatorService;

  beforeEach(() => {
    service = new GameCommandValidatorService();
  });

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
            },
            {
              id: { id: "actor-2" },
              owner: { ownerId: 1 },
              production: {}
            },
            {
              id: { id: "actor-3" },
              owner: { ownerId: 1 },
              research: {}
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

  function createQueueEvent(
    command: ProbableWaffleGameCommandEvent["commands"][number]
  ): ProbableWaffleGameCommandEvent {
    return {
      gameInstanceId: "gi-1",
      emitterUserId: "user-1",
      tick: 0,
      playerNumber: 1,
      commands: [command]
    };
  }

  it("accepts move commands with consistent tile and world coordinates", () => {
    expect(service.validate(createMoveEvent(640, 0), createGameInstance(), { id: "user-1" } as never)).toBe(true);
  });

  it("rejects move commands with inconsistent tile and world coordinates", () => {
    expect(service.validate(createMoveEvent(960, 0), createGameInstance(), { id: "user-1" } as never)).toBe(false);
  });

  it("accepts production commands from production buildings", () => {
    expect(
      service.validate(
        createQueueEvent({
          type: "PRODUCTION",
          tick: 0,
          playerNumber: 1,
          actorIds: ["actor-2"],
          actorName: "SkaduweeWorker"
        }),
        createGameInstance(),
        { id: "user-1" } as never
      )
    ).toBe(true);
  });

  it("rejects production commands from non-production actors", () => {
    expect(
      service.validate(
        createQueueEvent({
          type: "PRODUCTION",
          tick: 0,
          playerNumber: 1,
          actorIds: ["actor-1"],
          actorName: "SkaduweeWorker"
        }),
        createGameInstance(),
        { id: "user-1" } as never
      )
    ).toBe(false);
  });

  it("accepts research commands from research buildings", () => {
    expect(
      service.validate(
        createQueueEvent({
          type: "RESEARCH",
          tick: 0,
          playerNumber: 1,
          actorIds: ["actor-3"],
          researchType: "firestormSpell"
        }),
        createGameInstance(),
        { id: "user-1" } as never
      )
    ).toBe(true);
  });
});
