import { GameCommandValidatorService } from "./game-command-validator.service";
import {
  ObjectNames,
  type ProbableWaffleGameCommandEvent,
  type ProbableWaffleGameInstance,
  ResearchType
} from "@fuzzy-waddle/api-interfaces";

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
              name: ObjectNames.FrostForge,
              production: {
                queue: []
              },
              research: {
                researches: []
              }
            },
            {
              id: { id: "actor-3" },
              owner: { ownerId: 1 },
              name: ObjectNames.AnkGuard,
              production: {
                queue: []
              },
              research: {
                researches: []
              }
            }
          ]
        }
      }
    } as ProbableWaffleGameInstance;
  }

  function createMoveEvent(worldX: number, worldY: number, tick = 0): ProbableWaffleGameCommandEvent {
    return {
      gameInstanceId: "gi-1",
      emitterUserId: "user-1",
      tick,
      playerNumber: 1,
      commands: [
        {
          type: "MOVE",
          tick,
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
    expect(service.validate(createMoveEvent(640, 0), createGameInstance(), { id: "user-1" } as never)).toEqual({
      valid: true
    });
  });

  it("accepts move commands even when tile and world coordinates differ", () => {
    expect(service.validate(createMoveEvent(960, 0), createGameInstance(), { id: "user-1" } as never)).toEqual({
      valid: true
    });
  });

  it("accepts production commands from production buildings", () => {
    expect(
      service.validate(
        createQueueEvent({
          type: "PRODUCTION",
          tick: 0,
          playerNumber: 1,
          actorIds: ["actor-2"],
          actorName: ObjectNames.SkaduweeWorker
        }),
        createGameInstance(),
        { id: "user-1" } as never
      )
    ).toEqual({ valid: true });
  });

  it("accepts production commands from non-production actors while semantic validation is disabled", () => {
    expect(
      service.validate(
        createQueueEvent({
          type: "PRODUCTION",
          tick: 0,
          playerNumber: 1,
          actorIds: ["actor-1"],
          actorName: ObjectNames.SkaduweeWorker
        }),
        createGameInstance(),
        { id: "user-1" } as never
      )
    ).toEqual({ valid: true });
  });

  it("accepts research commands from research buildings", () => {
    expect(
      service.validate(
        createQueueEvent({
          type: "RESEARCH",
          tick: 0,
          playerNumber: 1,
          actorIds: ["actor-3"],
          researchType: ResearchType.FirestormSpell
        }),
        createGameInstance(),
        { id: "user-1" } as never
      )
    ).toEqual({ valid: true });
  });

  it("accepts production commands for any known unit while semantic validation is disabled", () => {
    expect(
      service.validate(
        createQueueEvent({
          type: "PRODUCTION",
          tick: 0,
          playerNumber: 1,
          actorIds: ["actor-2"],
          actorName: ObjectNames.TivaraMacemanMale
        }),
        createGameInstance(),
        { id: "user-1" } as never
      )
    ).toEqual({ valid: true });
  });

  it("accepts research commands for any known research while semantic validation is disabled", () => {
    expect(
      service.validate(
        createQueueEvent({
          type: "RESEARCH",
          tick: 0,
          playerNumber: 1,
          actorIds: ["actor-3"],
          researchType: ResearchType.HealingLightSpell
        }),
        createGameInstance(),
        { id: "user-1" } as never
      )
    ).toEqual({ valid: true });
  });

  it("drops (no relay) when user does not own the playerNumber", () => {
    const result = service.validate(createMoveEvent(640, 0), createGameInstance(), { id: "other-user" } as never);
    expect(result).toEqual({ valid: false, relayEmpty: false, reason: expect.any(String) });
  });

  it("drops stale duplicate ticks without advancing the canonical tick", () => {
    const instance = createGameInstance();
    const user = { id: "user-1" } as never;
    // First batch establishes tick 0
    service.validate(createMoveEvent(640, 0), instance, user);
    // Repeat tick 0 — must be dropped
    const result = service.validate(createMoveEvent(640, 0), instance, user);
    expect(result).toEqual({
      valid: false,
      relayEmpty: false,
      reason: expect.stringContaining("stale tick")
    });
  });

  it("relays empty on unknown command type (payload error)", () => {
    const event: ProbableWaffleGameCommandEvent = {
      gameInstanceId: "gi-1",
      emitterUserId: "user-1",
      tick: 0,
      playerNumber: 1,
      commands: [{ type: "UNKNOWN_TYPE" } as never]
    };
    const result = service.validate(event, createGameInstance(), { id: "user-1" } as never);
    expect(result).toEqual({ valid: false, relayEmpty: true, reason: expect.any(String) });
  });

  it("relays empty on unknown actor id (payload error)", () => {
    const event: ProbableWaffleGameCommandEvent = {
      gameInstanceId: "gi-1",
      emitterUserId: "user-1",
      tick: 0,
      playerNumber: 1,
      commands: [
        {
          type: "MOVE",
          tick: 0,
          playerNumber: 1,
          actorIds: ["nonexistent-actor"],
          tileVec3: { x: 10, y: 10, z: 0 },
          worldVec3: { x: 640, y: 0, z: 0 },
          queue: false
        }
      ]
    };
    const result = service.validate(event, createGameInstance(), { id: "user-1" } as never);
    expect(result).toEqual({ valid: false, relayEmpty: true, reason: expect.stringContaining("unknown actor") });
  });

  it("accepts high first tick after reseed bootstrap is enabled", () => {
    service.allowInitialTickBootstrap("gi-1");
    const result = service.validate(createMoveEvent(640, 0, 93), createGameInstance(), { id: "user-1" } as never);
    expect(result).toEqual({ valid: true });
  });
});
