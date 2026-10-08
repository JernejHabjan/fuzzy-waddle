import { ProbableWafflePlayer, ProbableWafflePlayerController, ProbableWafflePlayerState } from "./player";
import { PlayerResourceObservation } from "./player-resource-observation";
import type { PlayerResourceMutation } from "./player-resource-mutation";
import { ResourceType } from "../../probable-waffle/resource-type-definition";

function fixture() {
  const player = new ProbableWafflePlayer(new ProbableWafflePlayerState(), new ProbableWafflePlayerController());
  const events: PlayerResourceMutation[] = [], losses: string[] = [];
  const release = PlayerResourceObservation.subscribe(player, (event) => events.push(event), (reason) => losses.push(reason));
  return { player, events, losses, release };
}

describe("native player resource observation", () => {
  it("bounds loss-sink reentrancy while preserving each requested native addition", () => {
    const f = fixture();
    const extra = PlayerResourceObservation.subscribe(f.player, () => { throw new Error("listener"); }, () => {
      f.player.addResources({ wood: 2 });
    });
    f.player.addResources({ wood: 1 });
    expect(f.player.getResources().wood).toBe(205);
    expect(f.losses).toContain("recipient_mutation_listener_failed");
    extra(); f.release();
  });
  it("retains one outer vector identity and exact entry/terminal balances, including direct leaf payments", () => {
    const f = fixture(), request = { wood: 7, food: 3 };
    f.player.addResources(request);
    f.player.payAllResources({ wood: 2, food: 1 });
    f.player.payResources(ResourceType.Wood, 1);
    expect(f.events.map((event) => [event.kind, event.phase])).toEqual([
      ["add", "before"], ["add", "returned"], ["pay", "before"], ["pay", "returned"],
      ["pay", "before"], ["pay", "returned"]
    ]);
    expect(f.events[0].request).toBe(request);
    expect(f.events[0].operation).toBe(f.events[1].operation);
    expect(f.events[1]).toMatchObject({ before: { wood: 200 }, after: { wood: 207 }, bindingValid: true });
    expect(f.losses).toEqual([]);
    f.release();
  });
  it("preserves partial native payment and its original thrown error rather than rolling back", () => {
    const f = fixture();
    expect(() => f.player.payAllResources({ wood: 1, food: 201 })).toThrow("Not enough resources");
    expect(f.player.getResources().wood).toBe(199);
    expect(f.events).toHaveLength(2);
    expect(f.events[1]).toMatchObject({ phase: "threw", after: { wood: 199, food: 200 } });
    expect(f.losses).toContain("recipient_mutation_incomplete");
    f.release();
  });
  it("fences diagnostic reentrancy and reset before writes, while callbacks cannot replace native errors", () => {
    const f = fixture();
    let first = true;
    const extra = PlayerResourceObservation.subscribe(f.player, () => {
      if (first) { first = false; f.player.addResources({ wood: 2 }); }
      throw new Error("diagnostic");
    }, () => { throw new Error("loss sink"); });
    f.player.addResources({ wood: 1 });
    expect(f.player.getResources().wood).toBe(203);
    expect(f.losses).toContain("recipient_mutation_reentrancy");
    let woodBeforeReset: number | undefined;
    const reset = PlayerResourceObservation.subscribe(f.player, () => undefined, (reason) => {
      if (reason === "recipient_state_reset") woodBeforeReset = f.player.getResources().wood;
    });
    f.player.playerState.resetData();
    expect(woodBeforeReset).toBe(203);
    expect(f.losses).toContain("recipient_state_reset");
    expect(() => f.player.payResources(ResourceType.Wood, 201)).toThrow("Not enough resources");
    reset(); extra(); f.release();
  });
  it("leaves listener-free behavior native and fences listener saturation without invoking an accessor twice", () => {
    const f = fixture();
    const releases = Array.from({ length: 7 }, () => PlayerResourceObservation.subscribe(f.player, () => undefined, () => undefined));
    const overflow = jest.fn();
    const rejected = PlayerResourceObservation.subscribe(f.player, () => undefined, overflow);
    expect(overflow).toHaveBeenCalledWith("recipient_listener_overflow");
    let reads = 0;
    f.player.addResources({ get wood() { reads++; return 2; } });
    expect(reads).toBe(1);
    expect(f.losses).toContain("recipient_mutation_sample_missing");
    releases.forEach((release) => release()); rejected(); f.release();
    f.player.addResources({ wood: 1 });
    expect(f.player.getResources().wood).toBe(203);
  });
});
