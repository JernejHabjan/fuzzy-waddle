import { asCampaignContentId } from "../contracts/campaign-content-id";
import type { MissionParticipantDefinition } from "../contracts/mission-participant-definition";
import {
  evaluateMissionTriggerParticipantPolicy,
  missionFailureReached,
  rebindCampaignParticipants,
  resolveMissionParticipants
} from "./campaign-coop-policy";

describe("campaign co-op extension policy", () => {
  const participants: readonly MissionParticipantDefinition[] = [
    participant("tivara", "human"),
    { ...participant("skaduwee", "human"), singlePlayerSubstitution: "scripted-ai" }
  ];

  it("substitutes a future second human for single-player while retaining independent armies", () => {
    expect(resolveMissionParticipants(participants, undefined, 1)).toMatchObject([
      { slotId: "tivara", controller: "human", playerNumber: 1 },
      { slotId: "skaduwee", controller: "scripted-ai", playerNumber: 2 }
    ]);
    expect(resolveMissionParticipants(participants, undefined, 2)).toMatchObject([
      { controller: "human", playerNumber: 1 },
      { controller: "human", playerNumber: 2 }
    ]);
  });

  it("evaluates slot, faction, count, connected-human, and required-group trigger policies", () => {
    const resolved = resolveMissionParticipants(participants, undefined, 2);
    const event = {
      tick: 1,
      kind: "actor.entered-region",
      sourceId: "hero",
      sequence: 1,
      initiatorPlayerNumber: 2,
      initiatorFaction: "skaduwee"
    } as const;
    const context = {
      event,
      participants: resolved,
      connectedHumanPlayerNumbers: [1, 2],
      participatingPlayerNumbers: [2, 1],
      requiredGroupPlayerNumbers: { heroes: [1, 2] }
    };
    expect(
      evaluateMissionTriggerParticipantPolicy(
        { kind: "specific-slot", slotId: asCampaignContentId<"participant-slot">("skaduwee") },
        context
      )
    ).toBe(true);
    expect(evaluateMissionTriggerParticipantPolicy({ kind: "specific-faction", faction: 2 }, context)).toBe(true);
    expect(evaluateMissionTriggerParticipantPolicy({ kind: "all-connected-humans" }, context)).toBe(true);
    expect(evaluateMissionTriggerParticipantPolicy({ kind: "at-least", count: 2 }, context)).toBe(true);
    expect(
      evaluateMissionTriggerParticipantPolicy(
        { kind: "entire-required-group", groupId: asCampaignContentId<"scenario-group">("heroes") },
        context
      )
    ).toBe(true);
  });

  it("keeps defeat policy mission-specific and load rebinding identity-independent", () => {
    expect(
      missionFailureReached("all-required-heroes", {
        requiredHeroPlayerNumbers: [1, 2],
        defeatedHeroPlayerNumbers: [2, 1],
        requiredTeamPlayerNumbers: [1, 2],
        eliminatedPlayerNumbers: []
      })
    ).toBe(true);
    expect(
      rebindCampaignParticipants(
        [
          { slotId: asCampaignContentId<"participant-slot">("tivara"), playerNumber: 1 },
          { slotId: asCampaignContentId<"participant-slot">("skaduwee"), playerNumber: 2 }
        ],
        [
          { slotId: asCampaignContentId<"participant-slot">("skaduwee"), playerNumber: 1 },
          { slotId: asCampaignContentId<"participant-slot">("tivara"), playerNumber: 2 }
        ]
      )
    ).toEqual([
      { slotId: "skaduwee", savedPlayerNumber: 2, currentPlayerNumber: 1 },
      { slotId: "tivara", savedPlayerNumber: 1, currentPlayerNumber: 2 }
    ]);
  });
});

function participant(
  slotId: string,
  controller: MissionParticipantDefinition["controller"]
): MissionParticipantDefinition {
  return {
    slotId: asCampaignContentId<"participant-slot">(slotId),
    controller,
    faction: slotId === "tivara" ? 1 : 2,
    teamId: asCampaignContentId<"team">("allies"),
    economy: "normal",
    fogPolicy: "normal",
    profileOwnership: controller === "human" ? "independent" : "none"
  };
}
