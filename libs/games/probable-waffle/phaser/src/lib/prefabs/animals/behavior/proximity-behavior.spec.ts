import { State } from "mistreevous";
import { reactToNearby } from "./proximity-behavior";

describe("reactToNearby", () => {
  it("fails without a target and invokes the reaction once when one exists", () => {
    const react = jest.fn();
    expect(reactToNearby(() => undefined, react)).toBe(State.FAILED);
    expect(react).not.toHaveBeenCalled();
    const target = { x: 1, y: 2 };
    expect(reactToNearby(() => target, react)).toBe(State.SUCCEEDED);
    expect(react).toHaveBeenCalledWith(target);
  });
});
