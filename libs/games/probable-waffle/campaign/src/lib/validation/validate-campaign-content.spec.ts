import type { CampaignMissionContent } from "../contracts/campaign-mission-content";
import { asCampaignContentId } from "../contracts/campaign-content-id";
import type { MissionActionDefinition } from "../contracts/mission-action-definition";
import type { MissionPhaseDefinition } from "../contracts/mission-phase-definition";
import {
  AOTA_CAMPAIGN_DEFINITION,
  AOTA_CAMPAIGN_DIALOGUE,
  AOTA_CAMPAIGN_MISSIONS,
  AOTA_CAMPAIGN_REWARDS
} from "../catalog/ashes-of-the-ancients-content";
import {
  CampaignDefinitionRegistries,
  createDefaultCampaignDefinitionRegistries
} from "../registry/campaign-definition-registries";
import { validateCampaignContent } from "./validate-campaign-content";

describe("validateCampaignContent", () => {
  const phaseId = asCampaignContentId<"phase">("fixture-phase");
  const missingPhaseId = asCampaignContentId<"phase">("missing-phase");
  const actionId = asCampaignContentId<"action">("fixture-action");
  const factId = asCampaignContentId<"fact">("fixture-fact");
  const typedActionFixture = {
    id: actionId,
    kind: "set-fact",
    factId,
    value: true
  } satisfies MissionActionDefinition;

  it("reports duplicate mission IDs", () => {
    expect(validate([...AOTA_CAMPAIGN_MISSIONS, AOTA_CAMPAIGN_MISSIONS[0]!] as const)).toContain(
      "duplicate-mission-id"
    );
  });

  it("reports invalid prerequisites and prerequisite cycles", () => {
    const dreams = { ...AOTA_CAMPAIGN_MISSIONS[0]!, prerequisites: ["resolution"] } satisfies CampaignMissionContent;
    const issues = validate([dreams, ...AOTA_CAMPAIGN_MISSIONS.slice(1)]);

    expect(issues).toContain("invalid-prerequisites");
    expect(issues).toContain("prerequisite-cycle");
  });

  it("reports missing phase references with a source path", () => {
    const dreams = {
      ...AOTA_CAMPAIGN_MISSIONS[0]!,
      initialState: { ...AOTA_CAMPAIGN_MISSIONS[0]!.initialState, activePhaseIds: [missingPhaseId] }
    } satisfies CampaignMissionContent;
    const result = validateCampaignContent({
      campaign: AOTA_CAMPAIGN_DEFINITION,
      missions: [dreams, ...AOTA_CAMPAIGN_MISSIONS.slice(1)],
      dialogue: AOTA_CAMPAIGN_DIALOGUE,
      rewards: AOTA_CAMPAIGN_REWARDS,
      registries: createDefaultCampaignDefinitionRegistries()
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourcePath: "content/ashes-of-the-ancients/missions/dreams/mission.json",
          jsonPath: "$.initialState.activePhaseIds",
          code: "missing-phase-reference"
        })
      ])
    );
  });

  it("reports definition kinds missing from a registry", () => {
    const phase = {
      id: phaseId,
      mode: "sequential",
      entryActions: [typedActionFixture],
      exitActions: [],
      triggers: [],
      transitions: []
    } satisfies MissionPhaseDefinition;
    const dreams = {
      ...AOTA_CAMPAIGN_MISSIONS[0]!,
      initialState: { ...AOTA_CAMPAIGN_MISSIONS[0]!.initialState, activePhaseIds: [phaseId] },
      phases: [phase]
    } satisfies CampaignMissionContent;
    const result = validateCampaignContent({
      campaign: AOTA_CAMPAIGN_DEFINITION,
      missions: [dreams, ...AOTA_CAMPAIGN_MISSIONS.slice(1)],
      dialogue: AOTA_CAMPAIGN_DIALOGUE,
      rewards: AOTA_CAMPAIGN_REWARDS,
      registries: new CampaignDefinitionRegistries()
    });

    expect(result.issues.map((issue) => issue.code)).toContain("missing-action-kind");
  });

  it("validates nested actions, fallback declarations, and globally unique action IDs", () => {
    const duplicateId = asCampaignContentId<"action">("duplicate-action");
    const phase = {
      id: phaseId,
      mode: "sequential",
      entryActions: [
        {
          id: asCampaignContentId<"action">("sequence"),
          kind: "sequence",
          actions: [
            { id: duplicateId, kind: "set-fact", factId, value: true },
            { id: duplicateId, kind: "set-counter", counterId: asCampaignContentId("count"), value: 1 }
          ]
        },
        {
          id: asCampaignContentId<"action">("missing-fallback"),
          kind: "toggle-world-object",
          actorId: asCampaignContentId("bridge"),
          value: false,
          missingReferencePolicy: "fallback"
        }
      ],
      exitActions: [],
      triggers: [],
      transitions: []
    } satisfies MissionPhaseDefinition;
    const dreams = {
      ...AOTA_CAMPAIGN_MISSIONS[0]!,
      initialState: { ...AOTA_CAMPAIGN_MISSIONS[0]!.initialState, activePhaseIds: [phaseId] },
      phases: [phase]
    } satisfies CampaignMissionContent;

    const codes = validate([dreams, ...AOTA_CAMPAIGN_MISSIONS.slice(1)]);

    expect(codes).toContain("duplicate-action-id");
    expect(codes).toContain("missing-fallback-action");
  });

  function validate(missions: readonly CampaignMissionContent[]): readonly string[] {
    return validateCampaignContent({
      campaign: AOTA_CAMPAIGN_DEFINITION,
      missions,
      dialogue: AOTA_CAMPAIGN_DIALOGUE,
      rewards: AOTA_CAMPAIGN_REWARDS,
      registries: createDefaultCampaignDefinitionRegistries()
    }).issues.map((issue) => issue.code);
  }
});
