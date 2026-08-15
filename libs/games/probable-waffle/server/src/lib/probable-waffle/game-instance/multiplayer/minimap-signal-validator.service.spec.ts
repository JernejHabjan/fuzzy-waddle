import { MinimapSignalValidatorService } from "./minimap-signal-validator.service";
import {
  type ProbableWaffleGameInstance,
  type ProbableWaffleMinimapSignalEvent,
  ProbableWaffleMapEnum,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/probable-waffle-protocol";

describe("MinimapSignalValidatorService", () => {
  let service: MinimapSignalValidatorService;

  beforeEach(() => {
    service = new MinimapSignalValidatorService();
  });

  function gameInstance(overrides: Record<string, unknown> = {}): ProbableWaffleGameInstance {
    return {
      gameMode: { data: { map: ProbableWaffleMapEnum.Sandbox } },
      getPlayerByNumber: jest.fn().mockReturnValue({
        playerController: {
          data: {
            userId: "user-1",
            leftOrKilled: false,
            playerDefinition: { playerType: ProbableWafflePlayerType.Human }
          }
        }
      }),
      ...overrides
    } as unknown as ProbableWaffleGameInstance;
  }

  function signal(tile = { x: 1, y: 1 }): ProbableWaffleMinimapSignalEvent {
    return { gameInstanceId: "gi-1", emitterUserId: null, playerNumber: 1, tile };
  }

  it("accepts a valid human player's in-bounds tile", () => {
    expect(service.validate(signal(), gameInstance(), { id: "user-1" } as never)).toBe(true);
  });

  it("rejects a signal whose claimed player belongs to another user", () => {
    expect(service.validate(signal(), gameInstance(), { id: "user-2" } as never)).toBe(false);
  });

  it("rejects fractional and out-of-bounds tiles", () => {
    expect(service.validate(signal({ x: 1.5, y: 1 }), gameInstance(), { id: "user-1" } as never)).toBe(false);
    expect(service.validate(signal({ x: -1, y: 1 }), gameInstance(), { id: "user-1" } as never)).toBe(false);
  });

  it("rate-limits repeated signals from the same player", () => {
    expect(service.validate(signal(), gameInstance(), { id: "user-1" } as never)).toBe(true);
    expect(service.validate(signal({ x: 2, y: 2 }), gameInstance(), { id: "user-1" } as never)).toBe(false);
  });
});
