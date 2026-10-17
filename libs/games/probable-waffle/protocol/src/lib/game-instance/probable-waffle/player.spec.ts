import { ResourceType } from "../../probable-waffle/resource-type-definition";
import { ProbableWafflePlayerState } from "./player";

describe("ProbableWafflePlayerState", () => {
  it("starts a standard skirmish player with an equal 200-resource economy", () => {
    expect(new ProbableWafflePlayerState().data.resources).toEqual({
      [ResourceType.Food]: 200,
      [ResourceType.Wood]: 200,
      [ResourceType.Stone]: 200,
      [ResourceType.Minerals]: 200
    });
  });
});
