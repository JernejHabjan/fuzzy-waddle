import { ProbableWaffleGameCommandTypes } from "./game-instance/probable-waffle/game-command";
import {
  isProbableWaffleGameCommand,
  isProbableWaffleReplayPayload,
  isProbableWaffleSavePayload
} from "./transport-guards";

describe("probable-waffle protocol transport guards", () => {
  it("selects valid shared command/save/replay envelopes", () => {
    expect(
      isProbableWaffleGameCommand({
        type: ProbableWaffleGameCommandTypes.Stop,
        tick: 20,
        playerNumber: 1,
        actorIds: ["actor-1"]
      })
    ).toBe(true);
    expect(isProbableWaffleSavePayload({ version: 1, game: {} })).toBe(true);
    expect(isProbableWaffleReplayPayload({ version: 1, commands: [] })).toBe(true);
  });

  it.each([
    null,
    { type: "UNKNOWN", tick: 20, playerNumber: 1, actorIds: [] },
    { type: ProbableWaffleGameCommandTypes.Stop, tick: Number.NaN, playerNumber: 1, actorIds: [] },
    { type: ProbableWaffleGameCommandTypes.Stop, tick: 20, playerNumber: 1, actorIds: [7] }
  ])("rejects malformed shared command envelope %#", (payload) => {
    expect(isProbableWaffleGameCommand(payload)).toBe(false);
  });
});
