import type { GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import { aiDeadline } from "@fuzzy-waddle/probable-waffle-gameplay";
import {
  adaptCommandAuthorityToBrain,
  adaptGameCommandOutcomesToBrain,
  adaptGameCommandOutcomeToBrain
} from "./ai-command-outcome-adapter";

const outcome = (kind: GameCommandOutcome["kind"], sequence: number): GameCommandOutcome => ({
  schemaVersion: 1,
  kind,
  reason: kind === "dispatched" ? "accepted_for_dispatch" : "applied",
  tick: 10 + sequence,
  playerNumber: 2,
  commandId: `2:3:${sequence}:match-a`,
  commitmentKey: `opening:${sequence}`,
  authorityEpoch: 3,
  sequence,
  intentId: `opening-step-${sequence}`,
  effectId: `effect-${sequence}`,
  actorIds: ["caster-a"],
  worldLinkIds: [`world-${sequence}`]
});

describe("AI command outcome adapter", () => {
  it("preserves correlation identities and world links without exposing runtime objects", () => {
    expect(adaptGameCommandOutcomeToBrain(outcome("completed", 7), "match-a")).toEqual({
      kind: "completed",
      tick: 17,
      identity: {
        matchId: "match-a",
        authorityEpoch: 3,
        playerNumber: 2,
        sequence: 7,
        commandId: "command:2:3:7:match-a",
        effectId: "effect:effect-7",
        intentId: "intent:opening-step-7"
      },
      resultingActorIds: [],
      worldLinkIds: ["world-7"]
    });
  });

  it("canonicalizes permuted runtime outcomes before the pure brain consumes them", () => {
    const ordered = adaptGameCommandOutcomesToBrain([outcome("completed", 2), outcome("dispatched", 1)], "match-a");
    expect(ordered.map((entry) => `${entry.identity.sequence}:${entry.kind}`)).toEqual([
      "1:dispatched",
      "2:completed"
    ]);
  });

  it("projects the bounded authority cursor with typed command identities", () => {
    expect(
      adaptCommandAuthorityToBrain({
        authorityEpoch: 3,
        processedSequenceWatermark: 12,
        pendingCommandIds: ["b", "a"],
        pendingLimit: 128,
        reconciliationDeadline: aiDeadline(400),
        health: "reconciling"
      })
    ).toEqual({
      authorityEpoch: 3,
      processedSequenceWatermark: 12,
      pendingCommandIds: ["command:a", "command:b"],
      pendingLimit: 128,
      reconciliationDeadline: aiDeadline(400),
      health: "reconciling"
    });
  });
});
