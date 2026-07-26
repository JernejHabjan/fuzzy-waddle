import { FactionType, ObjectNames, ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import { asCampaignContentId } from "../contracts/campaign-content-id";
import type { MissionParticipantDefinition } from "../contracts/mission-participant-definition";
import { CampaignContentAllowanceService } from "./campaign-content-allowance-service";
import { resolveMissionDifficulty, resolveMissionEncounter } from "./campaign-difficulty-resolver";
import {
  resolveCampaignParticipantLaunchSlots,
  updateCampaignParticipantTeams,
  validateCampaignParticipants
} from "./campaign-participant-resolver";

describe("campaign encounter configuration", () => {
  it("maps every participant controller and multiple teams deterministically", () => {
    const participants = [
      participant("human", "blue", "human"),
      participant("economy-ai", "red", "full-ai"),
      participant("wave-ai", "red", "scripted-ai"),
      participant("neutral", "neutral", "passive")
    ] as const satisfies readonly MissionParticipantDefinition[];

    expect(validateCampaignParticipants(participants)).toEqual([]);
    expect(resolveCampaignParticipantLaunchSlots(participants)).toEqual([
      expect.objectContaining({ playerNumber: 1, teamNumber: 1, participant: participants[0] }),
      expect.objectContaining({ playerNumber: 2, teamNumber: 3, participant: participants[1] }),
      expect.objectContaining({ playerNumber: 3, teamNumber: 3, participant: participants[2] }),
      expect.objectContaining({ playerNumber: 4, teamNumber: 2, participant: participants[3] })
    ]);
    const teams = { "1": 1, "2": 3, "3": 3, "4": 2 };
    updateCampaignParticipantTeams(teams, 1, 2, true);
    expect(teams).toEqual({ "1": 1, "2": 1, "3": 3, "4": 2 });
    updateCampaignParticipantTeams(teams, 1, 2, false);
    expect(teams).toEqual({ "1": 1, "2": 2, "3": 3, "4": 2 });
  });

  it("merges exact difficulty and player-count patches before scaling a wave", () => {
    const difficulty = resolveMissionDifficulty(
      {
        story: {},
        normal: {},
        hard: { waveSizeScale: 2, warningTicks: 8 },
        playerCountOverrides: [{ playerCount: 2, hard: { waveSizeScale: 3, startingResourceScale: 1.5 } }]
      },
      "hard",
      2
    );
    const encounter = resolveMissionEncounter(
      {
        id: asCampaignContentId<"encounter">("raid"),
        start: { kind: "always" },
        waves: [
          {
            id: asCampaignContentId<"encounter-wave">("raid-one"),
            delayTicks: 2,
            spawns: [
              {
                spawnSetId: asCampaignContentId<"scenario-spawn-set">("raid-spawns"),
                actors: [{ actorName: ObjectNames.TivaraWorker, scenarioRoleId: asCampaignContentId("leader") }]
              }
            ]
          }
        ],
        difficultyOverrides: { hard: { warningTicks: 5 } },
        playerCountOverrides: [{ playerCount: 2, initialDelayTicks: 4 }]
      },
      difficulty
    );

    expect(difficulty).toMatchObject({ waveSizeScale: 3, startingResourceScale: 1.5, playerCount: 2 });
    expect(encounter).toMatchObject({ initialDelayTicks: 4 });
    expect(encounter.waves[0]?.warningTicks).toBe(5);
    expect(encounter.waves[0]?.spawns[0]?.actors).toHaveLength(3);
    expect(encounter.waves[0]?.spawns[0]?.actors.filter((actor) => actor.scenarioRoleId)).toHaveLength(1);
  });

  it("intersects permanent layers, enforces the strictest cap, and supports temporary grants", () => {
    const service = new CampaignContentAllowanceService();
    service.configurePlayer(1, [
      {
        allowedActorIds: [ObjectNames.TivaraWorker],
        unitLevelCaps: [{ objectName: ObjectNames.TivaraWorker, maximumLevel: 3 }]
      },
      {
        deniedResearchIds: [ResearchType.TivaraSlingshotUpgradeLevel2],
        unitLevelCaps: [{ objectName: ObjectNames.TivaraWorker, maximumLevel: 2 }]
      }
    ]);

    expect(service.isAllowed(1, "actor", ObjectNames.TivaraWorker)).toBe(true);
    expect(service.isAllowed(1, "actor", ObjectNames.Sandhold)).toBe(false);
    expect(service.isAllowed(1, "research", ResearchType.TivaraSlingshotUpgradeLevel2)).toBe(false);
    expect(service.getUnitLevelCap(1, ObjectNames.TivaraWorker)).toBe(2);
    service.grant({
      grantId: "tutorial-grant",
      playerNumber: 1,
      contentType: "research",
      contentId: ResearchType.TivaraSlingshotUpgradeLevel2
    });
    expect(service.isAllowed(1, "research", ResearchType.TivaraSlingshotUpgradeLevel2)).toBe(true);
    service.revoke("tutorial-grant");
    expect(service.isAllowed(1, "research", ResearchType.TivaraSlingshotUpgradeLevel2)).toBe(false);
  });
});

function participant(
  slotId: string,
  teamId: string,
  controller: MissionParticipantDefinition["controller"]
): MissionParticipantDefinition {
  return {
    slotId: asCampaignContentId<"participant-slot">(slotId),
    controller,
    faction: FactionType.Tivara,
    teamId: asCampaignContentId<"team">(teamId),
    economy: controller === "passive" ? "none" : controller === "scripted-ai" ? "granted" : "normal",
    fogPolicy: controller === "full-ai" ? "omniscient-ai" : "normal",
    startingResources: controller === "scripted-ai" ? {} : undefined
  };
}
