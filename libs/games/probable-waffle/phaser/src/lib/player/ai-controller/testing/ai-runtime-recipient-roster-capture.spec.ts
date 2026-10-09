import { ProbableWaffleGameInstance } from "@fuzzy-waddle/probable-waffle-protocol";
import { AiRuntimeRecipientRosterCapture } from "./ai-runtime-recipient-roster-capture";

describe("AiRuntimeRecipientRosterCapture", () => {
  it("fences before delegation, preserves the receiver, and restores inherited methods on disposal", () => {
    const gameInstance = new ProbableWaffleGameInstance();
    const original = Object.getOwnPropertyDescriptor(gameInstance, "addPlayer");
    const losses: string[] = [];
    const capture = new AiRuntimeRecipientRosterCapture(gameInstance, (reason) => losses.push(reason));
    const player = {} as never;
    const foreign = { players: [] as unknown[] };

    gameInstance.addPlayer.call(foreign as never, player);

    expect(foreign.players).toEqual([player]);
    expect(losses[0]).toBe("recipient_roster_mutation");
    capture.dispose();
    expect(Object.getOwnPropertyDescriptor(gameInstance, "addPlayer")).toEqual(original);
  });

  it("leaves a foreign replacement intact instead of overwriting it during disposal", () => {
    const gameInstance = new ProbableWaffleGameInstance();
    const losses: string[] = [];
    const capture = new AiRuntimeRecipientRosterCapture(gameInstance, (reason) => losses.push(reason));
    const replacement = () => undefined;
    Object.defineProperty(gameInstance, "stopLevel", { configurable: true, writable: true, value: replacement });

    capture.dispose();

    expect(gameInstance.stopLevel).toBe(replacement);
    expect(losses).toContain("recipient_roster_wrapper_replaced");
  });
});
