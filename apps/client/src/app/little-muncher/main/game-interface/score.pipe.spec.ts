import { WrapPipe } from "./wrap.pipe";

describe("ScorePipe", () => {
  it("create an instance", () => {
    const pipe = new WrapPipe();
    expect(pipe).toBeTruthy();
  });
});
