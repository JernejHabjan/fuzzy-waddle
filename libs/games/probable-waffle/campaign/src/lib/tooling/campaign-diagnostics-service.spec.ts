import { ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID, AOTA_CAMPAIGN_CONTENT_REGISTRY } from "../catalog/ashes-of-the-ancients-content";
import { asCampaignContentId } from "../contracts/campaign-content-id";
import { createCampaignMissionRuntimeState } from "../runtime/campaign-mission-runtime";
import {
  campaignProductionInvariantReport,
  DefaultCampaignDiagnosticsService,
  type CampaignDeveloperCommandExecutor
} from "./campaign-diagnostics-service";
import { CampaignMissionTestHarness } from "./campaign-mission-test-harness";

describe("campaign developer tooling", () => {
  const base = AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission("dreams");
  const content = {
    ...base,
    initialState: {
      ...base.initialState,
      facts: [{ id: asCampaignContentId<"fact">("debug-ready"), value: false, debugMutable: true }]
    },
    scenarioReferences: { actors: [asCampaignContentId<"scenario-actor">("hero")] }
  };

  it("keeps inspection reward-safe, invalidates before mutation, and disables mutation in production", () => {
    const state = createCampaignMissionRuntimeState(ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID, content);
    const calls: string[] = [];
    const executor: CampaignDeveloperCommandExecutor = {
      invalidateRewards: () => calls.push("invalidate"),
      execute: (command) => {
        calls.push(command.kind);
        return { accepted: true, invalidatedRewards: false };
      }
    };
    const development = new DefaultCampaignDiagnosticsService(content, () => state, executor, true);
    expect(development.execute({ kind: "focus-actor", actorId: "hero" })).toMatchObject({
      accepted: true,
      invalidatedRewards: false
    });
    expect(development.execute({ kind: "set-fact", factId: "debug-ready", value: true })).toMatchObject({
      accepted: true,
      invalidatedRewards: true
    });
    expect(development.execute({ kind: "set-fact", factId: "undeclared", value: true }).accepted).toBe(false);
    expect(calls).toEqual(["focus-actor", "invalidate", "set-fact"]);
    const production = new DefaultCampaignDiagnosticsService(content, () => state, executor, false);
    expect(production.execute({ kind: "set-fact", factId: "debug-ready", value: true }).accepted).toBe(false);
  });

  it("builds a read-only graph, bounded trace projection, and privacy-safe production report", () => {
    const state = createCampaignMissionRuntimeState(ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID, content);
    const service = new DefaultCampaignDiagnosticsService(
      content,
      () => state,
      { invalidateRewards: jest.fn(), execute: jest.fn() },
      true
    );
    expect(service.snapshot().phases.graph.nodes.length).toBe(content.phases.length);
    expect(service.trace()).toEqual([]);
    expect(campaignProductionInvariantReport(state, 42)).toMatchObject({ missionId: "dreams", seed: 42 });
    expect(JSON.stringify(campaignProductionInvariantReport(state, 42))).not.toContain("profileOwnerId");
  });

  it("advances and restores the same deterministic state without rendering", () => {
    const harness = new CampaignMissionTestHarness(ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID, content);
    harness.start();
    harness.advance(2);
    const before = harness.serialized();
    harness.roundTrip();
    expect(harness.serialized()).toBe(before);
  });
});
