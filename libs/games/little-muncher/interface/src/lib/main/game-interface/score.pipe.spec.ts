import { WrapPipe } from "@fuzzy-waddle/portal/shared/pipes/wrap.pipe";

describe("ScorePipe", () => {
  it("create an instance", () => {
    const pipe = new WrapPipe();
    expect(pipe).toBeTruthy();
  });
});
