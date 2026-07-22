import { asCampaignContentId } from "../contracts/campaign-content-id";
import {
  CAMPAIGN_CINEMATIC_HOLD_SKIP_MS,
  CAMPAIGN_CINEMATIC_VOTE_EXPIRY_MS,
  cinematicHoldProgress,
  cinematicSkipInputMode,
  evaluateCinematicSkipConsensus,
  InMemoryCampaignCinematicSkipVotePort
} from "./campaign-cinematic-presentation-service";

describe("campaign cinematic skip policy", () => {
  it("requires a three-second hold unless a seen cinematic permits tap skip", () => {
    expect(cinematicSkipInputMode({ seenSkipPolicy: "tap" }, false)).toBe("hold");
    expect(cinematicSkipInputMode({ seenSkipPolicy: "tap" }, true)).toBe("tap");
    expect(cinematicHoldProgress(1_000, 1_000 + CAMPAIGN_CINEMATIC_HOLD_SKIP_MS / 2)).toBe(0.5);
    expect(cinematicHoldProgress(1_000, 1_000 + CAMPAIGN_CINEMATIC_HOLD_SKIP_MS)).toBe(1);
  });

  it("accepts unanimous connected-human votes and expires them after ten seconds", () => {
    const votes = [
      { participantId: "one", requestedAtMs: 1_000 },
      { participantId: "two", requestedAtMs: 1_100 }
    ];
    expect(evaluateCinematicSkipConsensus(["two", "one"], votes, 1_000, 2_000)).toEqual({
      status: "accepted",
      missingParticipantIds: []
    });
    expect(
      evaluateCinematicSkipConsensus(
        ["one", "two"],
        votes.slice(0, 1),
        1_000,
        1_000 + CAMPAIGN_CINEMATIC_VOTE_EXPIRY_MS
      )
    ).toEqual({ status: "expired", missingParticipantIds: ["two"] });
  });

  it("keeps typed cinematic IDs compatible with the future vote port", () => {
    expect(asCampaignContentId<"cinematic">("intro")).toBe("intro");
  });

  it("restores vote state after host migration without changing consensus rules", () => {
    const cinematicId = asCampaignContentId<"cinematic">("intro");
    const oldHost = new InMemoryCampaignCinematicSkipVotePort();
    oldHost.requestVote(cinematicId, "one", 1_000);
    const newHost = new InMemoryCampaignCinematicSkipVotePort();
    newHost.restore(oldHost.snapshot());
    newHost.requestVote(cinematicId, "two", 1_100);
    const snapshot = newHost.snapshot();
    expect(evaluateCinematicSkipConsensus(["one", "two"], snapshot?.votes ?? [], 1_000, 2_000).status).toBe(
      "accepted"
    );
  });
});
