import { ProbableWafflePlayer, ProbableWafflePlayerController, ProbableWafflePlayerState } from
  "@fuzzy-waddle/probable-waffle-protocol";
import { observeResourceApplication } from "./observe-resource-application";

describe("exact service emission application join", () => {
  const player = () => new ProbableWafflePlayer(new ProbableWafflePlayerState(), new ProbableWafflePlayerController());
  it("joins one exact recipient/payload and rejects equal copies, duplicates and absent application", () => {
    const p = player(), request = { wood: 3 };
    const exact = observeResourceApplication(p, request);
    p.addResources(request);
    expect(exact()).toBeDefined();
    const copy = observeResourceApplication(p, request);
    p.addResources({ ...request });
    expect(copy()).toBeUndefined();
    const duplicate = observeResourceApplication(p, request);
    p.addResources(request); p.addResources(request);
    expect(duplicate()).toBeUndefined();
    expect(observeResourceApplication(p, request)()).toBeUndefined();
    const foreign = observeResourceApplication(p, request);
    player().addResources(request);
    expect(foreign()).toBeUndefined();
  });
});
