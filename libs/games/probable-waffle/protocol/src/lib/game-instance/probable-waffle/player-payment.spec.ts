import { ProbableWafflePlayer, ProbableWafflePlayerController, ProbableWafflePlayerState } from "./player";
import { ResourceType } from "../../probable-waffle/resource-type-definition";

function player() {
  return new ProbableWafflePlayer(new ProbableWafflePlayerState(), new ProbableWafflePlayerController());
}

describe("native payment admission", () => {
  it("rejects an unaffordable vector before deducting any of its affordable entries", () => {
    const subject = player();
    expect(() => subject.payAllResources({ wood: 10, food: 201 })).toThrow("Not enough resources");
    expect(subject.getResources()).toEqual({ food: 200, wood: 200, stone: 200, minerals: 200 });
  });
  it.each([-1, NaN, Infinity, -Infinity])("rejects invalid amount %s without minting or losing resources", (amount) => {
    const subject = player();
    expect(subject.canPayResources(ResourceType.Wood, amount)).toBe(false);
    expect(() => subject.payResources(ResourceType.Wood, amount)).toThrow();
    expect(subject.getResources().wood).toBe(200);
  });
  it("rejects an unknown resource key rather than adding a spendable alias", () => {
    const subject = player();
    const request = JSON.parse('{"wood":1,"bogus":0}');
    expect(subject.canPayAllResources(request)).toBe(false);
    expect(() => subject.payAllResources(request)).toThrow();
    expect(subject.getResources()).toEqual({ food: 200, wood: 200, stone: 200, minerals: 200 });
  });
  it("admits an exact balance and zero-cost vector without overspending", () => {
    const subject = player();
    subject.payAllResources({ wood: 200, food: 0 });
    expect(subject.getResources().wood).toBe(0);
    expect(subject.getResources().food).toBe(200);
    expect(() => subject.payAllResources({ wood: 1 })).toThrow("Not enough resources");
    expect(subject.getResources().wood).toBe(0);
  });
});
