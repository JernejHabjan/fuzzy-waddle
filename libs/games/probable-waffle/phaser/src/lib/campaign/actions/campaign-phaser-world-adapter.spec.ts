import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { CampaignPhaserWorldAdapter } from "./campaign-phaser-world-adapter";

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
