import { ProbableWaffleGameInstance, ProbableWafflePlayer, ProbableWafflePlayerState, ProbableWafflePlayerController } from
  "@fuzzy-waddle/probable-waffle-protocol";
import { AiRuntimeRecipientRosterCapture } from "./ai-runtime-recipient-roster-capture";

describe("AiRuntimeRecipientRosterCapture", () => {
  it("fences before delegation, preserves the receiver, and restores inherited methods on disposal", () => {
    const gameInstance = new ProbableWaffleGameInstance();
    const original = Object.getOwnPropertyDescriptor(gameInstance, "addPlayer");
    const losses: string[] = [];
    const capture = new AiRuntimeRecipientRosterCapture(gameInstance, (reason) => losses.push(reason));
    const player = new ProbableWafflePlayer(new ProbableWafflePlayerState(), new ProbableWafflePlayerController());
    const foreign = { players: [] as ProbableWafflePlayer[] };

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

  it("loses before temporary native remove/re-add and before a level reset writes player money", () => {
    const gameInstance = new ProbableWaffleGameInstance();
    const player = new ProbableWafflePlayer(new ProbableWafflePlayerState(), new ProbableWafflePlayerController());
    gameInstance.addPlayer(player); player.addResources({ wood: 7 });
    const observed: Array<{ reason: string; present: boolean; wood: number }> = [];
    const capture = new AiRuntimeRecipientRosterCapture(gameInstance, (reason) => {
      observed.push({ reason, present: gameInstance.players.includes(player), wood: player.getResources().wood });
    });
    gameInstance.removePlayerByPlayer(player); gameInstance.addPlayer(player); gameInstance.stopLevel();
    expect(observed).toEqual([
      { reason: "recipient_roster_mutation", present: true, wood: 207 },
      { reason: "recipient_roster_mutation", present: false, wood: 207 },
      { reason: "recipient_level_reset", present: true, wood: 207 }
    ]);
    expect(gameInstance.players).toEqual([player]); expect(player.getResources().wood).toBe(200);
    capture.dispose();
  });

  it("preserves own descriptors, arguments, native return/throw identity and cleanup with a throwing loss sink", () => {
    const gameInstance = new ProbableWaffleGameInstance(), error = new Error("native"), result = {};
    const native = jest.fn(function (this: unknown, value: unknown) {
      if (value === error) throw error;
      return { receiver: this, value, result };
    });
    Object.defineProperty(gameInstance, "removePlayerByUserId", {
      value: native, configurable: true, enumerable: true, writable: false
    });
    const descriptor = Object.getOwnPropertyDescriptor(gameInstance, "removePlayerByUserId");
    const capture = new AiRuntimeRecipientRosterCapture(gameInstance, () => { throw new Error("diagnostic"); });
    const receiver = {}, argument = {};
    const returned = Reflect.apply(gameInstance.removePlayerByUserId, receiver, [argument]);
    expect(returned).toEqual({ receiver, value: argument, result }); expect(returned).toBe(native.mock.results[0].value);
    let thrown: unknown;
    try { Reflect.apply(gameInstance.removePlayerByUserId, receiver, [error]); } catch (value) { thrown = value; }
    expect(thrown).toBe(error); expect(native).toHaveBeenCalledTimes(2);
    capture.dispose(); capture.dispose();
    expect(Object.getOwnPropertyDescriptor(gameInstance, "removePlayerByUserId")).toEqual(descriptor);
    const reinstalled = new AiRuntimeRecipientRosterCapture(gameInstance, () => undefined);
    expect(gameInstance.removePlayerByUserId).not.toBe(native);
    reinstalled.dispose(); expect(gameInstance.removePlayerByUserId).toBe(native);
  });

  it("rolls back prior installed slots when a later installation fails, even if reporting loss throws", () => {
    const gameInstance = new ProbableWaffleGameInstance(), add = gameInstance.addPlayer;
    Object.defineProperty(gameInstance, "removePlayerByUserId", {
      value: gameInstance.removePlayerByUserId, configurable: false, writable: false
    });
    const capture = new AiRuntimeRecipientRosterCapture(gameInstance, () => { throw new Error("diagnostic"); });
    expect(gameInstance.addPlayer).toBe(add);
    expect(Object.getOwnPropertyDescriptor(gameInstance, "addPlayer")).toBeUndefined();
    capture.dispose();
  });

  it("does not stack duplicate owners and restores only after the original owner disposes", () => {
    const gameInstance = new ProbableWaffleGameInstance(), original = gameInstance.addPlayer;
    const first = new AiRuntimeRecipientRosterCapture(gameInstance, () => undefined), wrapper = gameInstance.addPlayer;
    const losses: string[] = [];
    const second = new AiRuntimeRecipientRosterCapture(gameInstance, (reason) => losses.push(reason));
    second.dispose(); expect(gameInstance.addPlayer).toBe(wrapper);
    expect(losses).toEqual(["recipient_roster_capture_duplicated"]);
    first.dispose(); expect(gameInstance.addPlayer).toBe(original);
  });
});
