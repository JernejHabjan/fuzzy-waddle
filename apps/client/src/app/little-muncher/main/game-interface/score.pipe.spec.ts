import { WrapPipe } from "../../../shared/pipes/wrap.pipe";

describe("ScorePipe", () => {
  it("create an instance", () => {
    const pipe = new WrapPipe();
    expect(pipe).toBeTruthy();
  });
});
