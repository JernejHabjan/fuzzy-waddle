import Ajv2020 from "ajv/dist/2020";
import campaignSchema from "../../schemas/campaign.schema.json";
import coopOverrideSchema from "../../schemas/coop-override.schema.json";
import dialogueSchema from "../../schemas/dialogue.schema.json";
import difficultySchema from "../../schemas/difficulty.schema.json";
import missionSchema from "../../schemas/mission.schema.json";
import rewardsSchema from "../../schemas/rewards.schema.json";
import {
  AOTA_CAMPAIGN_CATALOG,
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  AOTA_CAMPAIGN_DEFINITION,
  AOTA_CAMPAIGN_DIALOGUE,
  AOTA_CAMPAIGN_MISSIONS,
  AOTA_CAMPAIGN_REWARDS
} from "./ashes-of-the-ancients-content";
import { CAMPAIGN_MISSION_IDS } from "@fuzzy-waddle/probable-waffle-protocol";
import { createDefaultCampaignDefinitionRegistries } from "../registry/campaign-definition-registries";
import { validateCampaignContent } from "../validation/validate-campaign-content";

describe("Ashes of the Ancients campaign content", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  ajv.addSchema(difficultySchema);
  const validateCampaignSchema = ajv.compile(campaignSchema);
  const validateMissionSchema = ajv.compile(missionSchema);
  const validateDialogueSchema = ajv.compile(dialogueSchema);
  const validateRewardsSchema = ajv.compile(rewardsSchema);
  const validateCoopOverrideSchema = ajv.compile(coopOverrideSchema);

  it("validates every first-party document against its JSON schema", () => {
    expect(validateCampaignSchema(AOTA_CAMPAIGN_DEFINITION)).toBe(true);
    for (const mission of AOTA_CAMPAIGN_MISSIONS) {
      expect({
        missionId: mission.id,
        errors: validateMissionSchema(mission) ? [] : validateMissionSchema.errors
      }).toEqual({
        missionId: mission.id,
        errors: []
      });
    }
    for (const dialogue of AOTA_CAMPAIGN_DIALOGUE) {
      expect({
        missionId: dialogue.missionId,
        errors: validateDialogueSchema(dialogue) ? [] : validateDialogueSchema.errors
      }).toEqual({
        missionId: dialogue.missionId,
        errors: []
      });
    }
    for (const rewards of AOTA_CAMPAIGN_REWARDS) {
      expect({
        missionId: rewards.missionId,
        errors: validateRewardsSchema(rewards) ? [] : validateRewardsSchema.errors
      }).toEqual({
        missionId: rewards.missionId,
        errors: []
      });
    }
    expect(
      validateCoopOverrideSchema({
        schemaVersion: 1,
        participants: [],
        playerCountDifficulty: [],
        failurePolicy: "mission-defined",
        disconnectedPlayerPolicy: "pause-for-reconnect"
      })
    ).toBe(true);
  });

  it("strictly validates foundational world actions and conditions", () => {
    const validateAction = ajv.compile({ $ref: `${missionSchema.$id}#/$defs/action` });
    const validateCondition = ajv.compile({ $ref: `${missionSchema.$id}#/$defs/condition` });
    const validateObjective = ajv.compile({ $ref: `${missionSchema.$id}#/$defs/objective` });

    expect(
      validateAction({ id: "move-hero", kind: "move-along-route", actorId: "hero", routeId: "escape-route" })
    ).toBe(true);
    expect(validateAction({ id: "move-hero", kind: "move-along-route", actorId: "hero" })).toBe(false);
    expect(
      validateCondition({
        kind: "region-occupancy",
        regionId: "escape-zone",
        selector: { groupId: "heroes" },
        policy: { kind: "entire-group", groupId: "heroes" }
      })
    ).toBe(true);
    expect(validateCondition({ kind: "region-occupancy", regionId: "escape-zone" })).toBe(false);
    expect(
      validateAction({
        id: "complete-step",
        kind: "set-objective-checklist-state",
        objectiveId: "tutorial",
        checklistId: "select-unit",
        state: "completed"
      })
    ).toBe(true);
    expect(
      validateCondition({
        kind: "objective-checklist",
        objectiveId: "tutorial",
        checklistId: "select-unit",
        state: "completed"
      })
    ).toBe(true);
    expect(
      validateObjective({
        id: "tutorial",
        kind: "tutorial",
        titleTextId: "tutorial-title",
        reveal: { kind: "always" },
        complete: {
          kind: "objective-checklist",
          objectiveId: "tutorial",
          checklistId: "select-unit",
          state: "completed"
        },
        checklist: [
          {
            id: "select-unit",
            textId: "select-unit-text",
            complete: { kind: "fact", factId: "selected", equals: true },
            progress: { counterId: "selected-count", target: 1, display: "count" },
            inputPrompt: { action: "selection.primary", seenPolicy: "collapse" }
          }
        ],
        display: { announceReveal: true, announceCompletion: true, showInTracker: true }
      })
    ).toBe(true);
  });

  it("strictly validates portraits, every presentation cue, and inline deterministic cinematic actions", () => {
    const bundle = {
      schemaVersion: 1,
      missionId: "dreams",
      texts: [
        { id: "guide-name", text: "Guide" },
        { id: "chapter-title", text: "Awakening" }
      ],
      portraits: [{ id: "guide-portrait", textureKey: "campaign-portraits", frame: "guide" }],
      speakers: [{ id: "guide", nameTextId: "guide-name", portraitId: "guide-portrait" }],
      lines: [
        {
          id: "opening-line",
          speakerId: "guide",
          textId: "opening-text",
          text: "Wake up.",
          audioAssetKey: "voice-opening",
          delivery: "blocking",
          minimumTicks: 10
        }
      ],
      cinematics: [
        {
          id: "intro",
          mode: "paused",
          seenSkipPolicy: "tap",
          lockPlayerControl: true,
          lockCamera: true,
          resumeCueIndexes: [0, 4],
          fallbackTimeoutTicks: 200,
          timeline: [
            { kind: "letterbox", visible: true },
            { kind: "title", textId: "chapter-title" },
            { kind: "dialogue", lineId: "opening-line" },
            { kind: "wait", durationTicks: 5 },
            { kind: "camera-shot", shotId: "opening-shot", fallbackPointId: "fallback", durationTicks: 10 },
            { kind: "camera-actor", actorId: "hero", fallbackPointId: "fallback", durationTicks: 10 },
            { kind: "audio", assetKey: "sting", waitForCompletion: true },
            { kind: "ui-suppression", suppressed: false },
            { kind: "actor-animation", actorId: "hero", animationKey: "celebrate" }
          ],
          gameplayPrelude: [{ id: "prepare-intro", kind: "set-fact", factId: "intro-prepared", value: true }],
          gameplayFinalize: [{ id: "finish-intro", kind: "set-fact", factId: "intro-finished", value: true }]
        }
      ]
    };

    expect(validateDialogueSchema(bundle)).toBe(true);
    expect(validateDialogueSchema({ ...bundle, unexpected: true })).toBe(false);
  });

  it("passes whole-catalogue semantic validation in the authored mandatory order", () => {
    const result = validateCampaignContent({
      campaign: AOTA_CAMPAIGN_DEFINITION,
      missions: AOTA_CAMPAIGN_MISSIONS,
      dialogue: AOTA_CAMPAIGN_DIALOGUE,
      rewards: AOTA_CAMPAIGN_REWARDS,
      registries: createDefaultCampaignDefinitionRegistries()
    });

    expect(result.issues).toEqual([]);
    expect(AOTA_CAMPAIGN_CATALOG.chapters.flatMap((chapter) => chapter.missions.map((mission) => mission.id))).toEqual(
      CAMPAIGN_MISSION_IDS
    );
  });

  it("uses one mission object for every framework consumer", () => {
    for (const mission of AOTA_CAMPAIGN_MISSIONS) {
      expect(AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(mission.id)).toBe(mission);
    }
  });
});
