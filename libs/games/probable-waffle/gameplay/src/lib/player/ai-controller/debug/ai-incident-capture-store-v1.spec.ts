import { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiReproBundleV1 } from "../contracts/ai-repro-bundle-v1";
import { AiIncidentCaptureStoreV1 } from "./ai-incident-capture-store-v1";

function bundle(id: number): AiReproBundleV1 {
  return {
    schemaVersion: 1,
    kind: "decision",
    replayInputs: {
      sourceRevision: "source",
      dirtySourceDigest: null,
      mapId: "map",
      mapDigest: "map:1",
      contentDigest: "content:1",
      configVersion: "config:1",
      profileVersion: "skirmish-ai-v1",
      archetypeVersion: "opening-archetypes-v1",
      difficulty: "normal",
      faction: FactionType.Tivara,
      playerNumber: 1,
      rulesVersion: "rules:1",
      tickInterval: 50,
      authorityEpoch: 0,
      tick: id,
      snapshotReference: `snapshot-${id}.json`,
      snapshotDigest: `snapshot:${id}`,
      inputReference: `input-${id}.json`,
      inputDigest: `input:${id}`,
      expectedCheckpoints: [],
      scenarioId: "DBG-06"
    },
    completeness: {
      observation: "complete",
      priorState: "complete",
      outcomes: "complete",
      alternatives: "not_recorded",
      missingRanges: [],
      truncatedEventCount: 0
    },
    privacy: "permitted_player_data",
    display: { label: `<b>incident ${id}</b>` }
  };
}

describe("AiIncidentCaptureStoreV1", () => {
  it("DBG-01/06 retains one automatic capture per episode and evicts beyond five", () => {
    const store = new AiIncidentCaptureStoreV1();
    expect(store.addAutomatic("episode:1", bundle(1))).toBe("captured");
    expect(store.addAutomatic("episode:1", bundle(2))).toBe("episode_already_captured");
    for (let id = 2; id <= 7; id += 1) expect(store.addAutomatic(`episode:${id}`, bundle(id))).toBe("captured");
    expect(store.snapshot()).toHaveLength(5);
    expect(store.snapshot()[0]?.causalEpisodeId).toBe("episode:3");
    store.dispose();
    expect(store.snapshot()).toEqual([]);
  });

  it("DBG-05 stores labels as inert data rather than rendering HTML", () => {
    const store = new AiIncidentCaptureStoreV1();
    store.addAutomatic("episode:html", bundle(1));
    expect(store.snapshot()[0]?.bundle.display.label).toBe("<b>incident 1</b>");
  });

  it("DBG-06 rejects an automatic capture that would exceed the configured session quota", () => {
    const store = new AiIncidentCaptureStoreV1({ maxRetainedIncidentBundles: 5, sessionQuotaBytes: 1 });
    expect(store.addAutomatic("episode:large", bundle(1))).toBe("quota_exceeded");
    expect(store.snapshot()).toEqual([]);
  });
});
