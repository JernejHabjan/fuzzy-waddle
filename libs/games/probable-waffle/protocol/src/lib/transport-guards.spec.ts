import { ProbableWaffleGameCommandTypes } from "./game-instance/probable-waffle/game-command";
import { ObjectNames } from "./game-instance/probable-waffle/object-names";
import {
  isProbableWaffleGameCommand,
  isProbableWaffleGameCommandOutcome,
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

  it.each([
    {
      type: ProbableWaffleGameCommandTypes.Construct,
      tick: 12,
      playerNumber: 2,
      actorIds: ["builder-1"],
      actorName: ObjectNames.Olival,
      tileVec3: { x: 4, y: 8, z: 0 },
      siteKey: "2:Olival:4:8"
    },
    {
      type: ProbableWaffleGameCommandTypes.CastSpell,
      tick: 12,
      playerNumber: 2,
      actorIds: ["caster-1"],
      spellType: "HealingLight",
      targetObjectId: "ally-1",
      tileVec3: { x: 5, y: 8, z: 0 }
    },
    {
      type: ProbableWaffleGameCommandTypes.Unload,
      tick: 12,
      playerNumber: 2,
      actorIds: ["transport-1"],
      passengerIds: ["passenger-1"]
    },
    {
      type: ProbableWaffleGameCommandTypes.SetRallyPoint,
      tick: 12,
      playerNumber: 2,
      actorIds: ["barracks-1"],
      tileVec3: { x: 6, y: 9, z: 0 },
      worldVec3: { x: 480, y: 320, z: 0 }
    },
    {
      type: ProbableWaffleGameCommandTypes.Concede,
      tick: 12,
      playerNumber: 2,
      actorIds: [],
      reason: "surrender_accepted"
    }
  ])("accepts Stage 3 command family payload %#", (payload) => {
    expect(isProbableWaffleGameCommand(payload)).toBe(true);
  });

  it("accepts deterministic execution metadata and rejects an identity with the wrong scalar shape", () => {
    const command = {
      type: ProbableWaffleGameCommandTypes.Stop,
      tick: 12,
      playerNumber: 2,
      actorIds: ["actor-1"],
      execution: {
        schemaVersion: 1,
        commandId: "2:3:7:game",
        commitmentKey: "stop:actor-1",
        source: "ai",
        authorityEpoch: 3,
        sequence: 7
      }
    };
    expect(isProbableWaffleGameCommand(command)).toBe(true);
    expect(isProbableWaffleGameCommand({ ...command, execution: { ...command.execution, sequence: -1 } })).toBe(
      false
    );
  });

  it("validates persisted command outcomes carried by replay artifacts", () => {
    const commandOutcome = {
      schemaVersion: 1,
      kind: "completed",
      reason: "applied",
      tick: 14,
      playerNumber: 2,
      commandId: "2:3:7:game",
      commitmentKey: "opening:worker:1",
      authorityEpoch: 3,
      sequence: 7,
      intentId: "opening-worker",
      effectId: "worker-1",
      actorIds: ["producer-1"],
      worldLinkIds: ["worker-1"]
    };
    expect(isProbableWaffleGameCommandOutcome(commandOutcome)).toBe(true);
    expect(isProbableWaffleReplayPayload({ version: 1, commands: [], commandOutcomes: [commandOutcome] })).toBe(
      true
    );
    expect(
      isProbableWaffleReplayPayload({
        version: 1,
        commands: [],
        commandOutcomes: [{ ...commandOutcome, reason: "invented_reason" }]
      })
    ).toBe(false);
  });
});
