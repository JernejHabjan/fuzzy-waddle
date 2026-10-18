import { asCampaignContentId } from "@fuzzy-waddle/probable-waffle-campaign";
import {
  campaignAudioCuePlayback,
  campaignCameraCueTarget,
  campaignCinematicOwnership,
  campaignDialoguePresentationCategory,
  LocalCampaignSeenCinematicStore
} from "./campaign-cinematic-presentation.service";

describe("Phaser campaign cinematic presentation policy", () => {
  it.each([
    ["gameplay", false, false, false],
    ["directed", true, true, false],
    ["paused", true, true, true]
  ] as const)(
    "maps %s mode to control, camera, and pause ownership",
    (mode, lockControl, lockCamera, pauseSimulation) => {
      expect(campaignCinematicOwnership({ mode })).toEqual({ lockControl, lockCamera, pauseSimulation });
    }
  );

  it("honors explicit directed-mode lock overrides", () => {
    expect(campaignCinematicOwnership({ mode: "directed", lockPlayerControl: false, lockCamera: true })).toEqual({
      lockControl: false,
      lockCamera: true,
      pauseSimulation: false
    });
  });

  it("persists stable seen-cinematic markers for fast skip", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value)
    };
    const store = new LocalCampaignSeenCinematicStore(storage);
    const cinematicId = asCampaignContentId<"cinematic">("intro");

    expect(store.hasSeen("ashes-of-the-ancients", cinematicId)).toBe(false);
    store.markSeen("ashes-of-the-ancients", cinematicId);
    expect(new LocalCampaignSeenCinematicStore(storage).hasSeen("ashes-of-the-ancients", cinematicId)).toBe(true);
  });

  it.each([
    ["blocking", "blocking-dialogue"],
    ["non-blocking", "ambient"],
    ["ambient", "ambient"],
    ["tutorial", "tutorial"]
  ] as const)("routes %s delivery through the shared presentation priorities", (delivery, category) => {
    expect(campaignDialoguePresentationCategory(delivery)).toBe(category);
  });

  it("continues silently when optional cinematic audio is missing", () => {
    expect(campaignAudioCuePlayback(false, true, true)).toBe("skip");
    expect(campaignAudioCuePlayback(true, false, true)).toBe("skip");
    expect(campaignAudioCuePlayback(true, true, false)).toBe("play-and-continue");
    expect(campaignAudioCuePlayback(true, true, true)).toBe("play-and-wait");
  });

  it("falls back from a destroyed camera target and otherwise keeps the current camera", () => {
    const authoredTarget = { x: 10, y: 20, z: 3 };
    const fallbackPoint = { x: 2, y: 4, z: 0 };

    expect(campaignCameraCueTarget(authoredTarget, fallbackPoint)).toBe(authoredTarget);
    expect(campaignCameraCueTarget(undefined, fallbackPoint)).toBe(fallbackPoint);
    expect(campaignCameraCueTarget(undefined, undefined)).toBeUndefined();
  });
});
