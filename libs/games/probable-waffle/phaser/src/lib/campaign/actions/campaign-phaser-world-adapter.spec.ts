import type { CampaignMissionActionContext } from "@fuzzy-waddle/probable-waffle-campaign";
import { asCampaignContentId } from "@fuzzy-waddle/probable-waffle-campaign";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import {
  createPlayerLobbyDefinition,
  ProbableWafflePlayerType,
  type CampaignMissionRuntimeState
} from "@fuzzy-waddle/probable-waffle-protocol";
import { CampaignPhaserWorldAdapter, updateCampaignAllianceDefinitions } from "./campaign-phaser-world-adapter";

describe("CampaignPhaserWorldAdapter presentation requests", () => {
  it("gives each objective notification narration a stable unique owner token", () => {
    const adapter = new CampaignPhaserWorldAdapter({} as ProbableWaffleScene);
    const requests: unknown[] = [];
    adapter.presentationRequests$.subscribe((request) => requests.push(request));

    adapter.requestObjectiveNarration("objective-line", "objective:survive:active:10");
    adapter.requestObjectiveNarration("objective-line", "objective:survive:completed:20");

    expect(requests).toEqual([
      {
        kind: "dialogue",
        id: "objective-line",
        ownerToken: "mission:objective-narration:objective:survive:active:10"
      },
      {
        kind: "dialogue",
        id: "objective-line",
        ownerToken: "mission:objective-narration:objective:survive:completed:20"
      }
    ]);
    adapter.destroy();
  });
});

describe("updateCampaignAllianceDefinitions", () => {
  it("joins and splits authored teams without changing unrelated teams", () => {
    const definition = (playerNumber: number, team: number) => ({
      player: createPlayerLobbyDefinition(playerNumber),
      playerType: ProbableWafflePlayerType.AI,
      team
    });
    const first = definition(1, 1);
    const second = definition(2, 2);
    const third = definition(3, 3);

    updateCampaignAllianceDefinitions(first, second, 1, 2, true);
    expect([first.team, second.team, third.team]).toEqual([1, 1, 3]);
    updateCampaignAllianceDefinitions(first, second, 1, 2, false);
    expect([first.team, second.team, third.team]).toEqual([1, 2, 3]);
  });
});

describe("CampaignPhaserWorldAdapter AI ownership", () => {
  it("records AI toggles on non-host peers without requiring a host-only controller", () => {
    const playerDefinition = {
      player: createPlayerLobbyDefinition(2),
      playerType: ProbableWafflePlayerType.AI,
      campaignController: "full-ai" as const,
      campaignAiEnabled: true
    };
    const scene = {
      isHost: false,
      players: [{ playerNumber: 2, playerController: { data: { playerDefinition } } }]
    } as unknown as ProbableWaffleScene;
    const adapter = new CampaignPhaserWorldAdapter(scene);
    adapter.restoreParticipantTeams({ "2": 4 });
    expect(playerDefinition.team).toBe(4);
    const state = { ownedResources: {} } as CampaignMissionRuntimeState;
    const context = { tick: 1, ownerToken: "mission:phase:test", state } satisfies CampaignMissionActionContext;
    const result = adapter.execute(context, {
      id: asCampaignContentId<"action">("pause-ai"),
      kind: "set-ai-enabled",
      playerNumber: 2,
      enabled: false
    });

    expect(result).toMatchObject({ status: "completed" });
    expect(playerDefinition.campaignAiEnabled).toBe(false);
    if (result.status === "completed") {
      for (const resource of result.ownedResources ?? []) {
        state.ownedResources[resource.resourceId] = { ...resource, ownerToken: context.ownerToken };
      }
    }
    const resumed = adapter.execute(context, {
      id: asCampaignContentId<"action">("resume-ai"),
      kind: "set-ai-enabled",
      playerNumber: 2,
      enabled: true
    });
    expect(playerDefinition.campaignAiEnabled).toBe(true);
    expect(
      adapter.releaseOwnedResources(
        "mission:phase:test",
        resumed.status === "completed" ? (resumed.ownedResources ?? []) : [],
        "phase-exited"
      )
    ).toEqual([]);
    expect(playerDefinition.campaignAiEnabled).toBe(true);
    adapter.destroy();
  });
});
