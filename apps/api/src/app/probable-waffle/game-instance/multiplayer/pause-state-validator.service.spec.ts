import { PauseStateValidatorService } from "./pause-state-validator.service";
import type { ProbableWaffleGameInstance, ProbableWafflePauseChangedEvent } from "@fuzzy-waddle/api-interfaces";

describe("PauseStateValidatorService", () => {
  let service: PauseStateValidatorService;

  beforeEach(() => {
    service = new PauseStateValidatorService();
  });

  function createGameInstance(): ProbableWaffleGameInstance {
    return {
      getPlayerByNumber: jest.fn().mockReturnValue({
        playerController: {
          data: {
            userId: "user-1"
          }
        }
      })
    } as unknown as ProbableWaffleGameInstance;
  }

  function createPauseEvent(paused: boolean): ProbableWafflePauseChangedEvent {
    return {
      gameInstanceId: "gi-1",
      emitterUserId: "user-1",
      playerNumber: 1,
      paused
    };
  }

  it("accepts a pause followed by a resume", () => {
    expect(service.validate(createPauseEvent(true), createGameInstance(), { id: "user-1" } as never)).toBe(true);
    expect(service.validate(createPauseEvent(false), createGameInstance(), { id: "user-1" } as never)).toBe(true);
  });

  it("rejects duplicate pause state broadcasts", () => {
    expect(service.validate(createPauseEvent(true), createGameInstance(), { id: "user-1" } as never)).toBe(true);
    expect(service.validate(createPauseEvent(true), createGameInstance(), { id: "user-1" } as never)).toBe(false);
  });
});
