import type { CampaignMissionContent } from "../contracts/campaign-mission-content";
import { asCampaignContentId } from "../contracts/campaign-content-id";
import type { MissionActionDefinition } from "../contracts/mission-action-definition";
import type { MissionDialogueBundle } from "../contracts/mission-dialogue-bundle";
import type { MissionPhaseDefinition } from "../contracts/mission-phase-definition";
import type { MissionObjectiveDefinition } from "../contracts/mission-objective-definition";
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

  it("rejects deterministic triggers driven by local presentation timing", () => {
    const phase = {
      id: phaseId,
      mode: "sequential",
      entryActions: [],
      exitActions: [],
      triggers: [
        {
          id: asCampaignContentId<"trigger">("presentation-cue-trigger"),
          kind: "event",
          eventKinds: ["cinematic.cue"],
          condition: { kind: "always" },
          actions: [typedActionFixture],
          firing: { kind: "once" },
          priority: 0
        }
      ],
      transitions: []
    } satisfies MissionPhaseDefinition;
    const dreams = {
      ...AOTA_CAMPAIGN_MISSIONS[0]!,
      initialState: { ...AOTA_CAMPAIGN_MISSIONS[0]!.initialState, activePhaseIds: [phaseId] },
      phases: [phase]
    } satisfies CampaignMissionContent;

    expect(validate([dreams, ...AOTA_CAMPAIGN_MISSIONS.slice(1)])).toContain("local-presentation-event-trigger");
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

  it("validates objective text, checklist, and dependency references", () => {
    const first = {
      id: asCampaignContentId<"objective">("first"),
      kind: "primary",
      titleTextId: asCampaignContentId<"text">("missing-title"),
      reveal: { kind: "always" },
      complete: {
        kind: "objective-checklist",
        objectiveId: asCampaignContentId<"objective">("first"),
        checklistId: asCampaignContentId<"objective-checklist">("missing-checklist"),
        state: "completed"
      },
      dependsOnObjectiveIds: [asCampaignContentId<"objective">("second")],
      checklist: [
        {
          id: asCampaignContentId<"objective-checklist">("duplicate"),
          textId: asCampaignContentId<"text">("missing-checklist"),
          complete: { kind: "never" }
        },
        {
          id: asCampaignContentId<"objective-checklist">("duplicate"),
          textId: asCampaignContentId<"text">("missing-checklist"),
          complete: { kind: "never" }
        }
      ],
      display: { announceReveal: true, announceCompletion: true, showInTracker: true }
    } satisfies MissionObjectiveDefinition;
    const second = {
      ...first,
      id: asCampaignContentId<"objective">("second"),
      dependsOnObjectiveIds: [first.id],
      checklist: []
    } satisfies MissionObjectiveDefinition;
    const dreams = { ...AOTA_CAMPAIGN_MISSIONS[0]!, objectives: [first, second] } satisfies CampaignMissionContent;
    const result = validateCampaignContent({
      campaign: AOTA_CAMPAIGN_DEFINITION,
      missions: [dreams, ...AOTA_CAMPAIGN_MISSIONS.slice(1)],
      dialogue: AOTA_CAMPAIGN_DIALOGUE,
      rewards: AOTA_CAMPAIGN_REWARDS,
      registries: createDefaultCampaignDefinitionRegistries()
    });
    const codes = result.issues.map((issue) => issue.code);

    expect(codes).toContain("missing-text-reference");
    expect(codes).toContain("duplicate-objective-checklist-id");
    expect(codes).toContain("missing-objective-checklist-reference");
    expect(codes).toContain("objective-dependency-cycle");
  });

  it("validates cinematic metadata, cues, inline actions, and safe resume markers", () => {
    const introId = asCampaignContentId<"cinematic">("intro");
    const speakerId = asCampaignContentId<"speaker">("guide");
    const missingPortraitId = asCampaignContentId<"portrait">("missing-portrait");
    const duplicatePortraitId = asCampaignContentId<"portrait">("duplicate-portrait");
    const dialogue = {
      schemaVersion: 1,
      missionId: AOTA_CAMPAIGN_MISSIONS[0]!.id,
      texts: [{ id: asCampaignContentId<"text">("guide-name"), text: "Guide" }],
      portraits: [
        { id: duplicatePortraitId, textureKey: "guide" },
        { id: duplicatePortraitId, textureKey: "guide-alt" }
      ],
      speakers: [
        {
          id: speakerId,
          nameTextId: asCampaignContentId<"text">("guide-name"),
          portraitId: missingPortraitId
        }
      ],
      lines: [
        {
          id: asCampaignContentId<"dialogue-line">("guide-line"),
          speakerId,
          textId: asCampaignContentId<"text">("guide-line-text"),
          text: "Keep moving.",
          portraitId: missingPortraitId,
          delivery: "blocking"
        }
      ],
      cinematics: [
        {
          id: introId,
          mode: "directed",
          seenSkipPolicy: "tap",
          resumeCueIndexes: [99],
          timeline: [
            { kind: "dialogue", lineId: asCampaignContentId<"dialogue-line">("missing-line") },
            { kind: "title", textId: asCampaignContentId<"text">("missing-title") },
            {
              kind: "camera-shot",
              shotId: asCampaignContentId<"scenario-camera-shot">("missing-shot"),
              fallbackPointId: asCampaignContentId<"scenario-point">("missing-point")
            },
            { kind: "camera-actor", actorId: asCampaignContentId<"scenario-actor">("missing-actor") }
          ],
          gameplayPrelude: [
            {
              id: asCampaignContentId<"action">("recursive-cinematic"),
              kind: "start-cinematic",
              cinematicId: introId
            }
          ],
          gameplayFinalizeActionIds: []
        }
      ]
    } satisfies MissionDialogueBundle;
    const result = validateCampaignContent({
      campaign: AOTA_CAMPAIGN_DEFINITION,
      missions: AOTA_CAMPAIGN_MISSIONS,
      dialogue: [dialogue, ...AOTA_CAMPAIGN_DIALOGUE.slice(1)],
      rewards: AOTA_CAMPAIGN_REWARDS,
      registries: createDefaultCampaignDefinitionRegistries()
    });
    const codes = result.issues.map((issue) => issue.code);

    expect(codes).toEqual(
      expect.arrayContaining([
        "duplicate-portrait-id",
        "missing-portrait-reference",
        "missing-dialogue-reference",
        "missing-text-reference",
        "missing-scenario-reference",
        "invalid-cinematic-resume-cue",
        "cinematic-action-cycle"
      ])
    );
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
