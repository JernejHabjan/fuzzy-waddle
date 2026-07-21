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
