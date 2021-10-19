import { SomeTestClass } from "../scripts/scenes/just-test-class";

describe("Testing is working", () => {
  it("should work", () => {
    expect(true).toBeTruthy();
  });
});

describe("Some Test Class", () => {
  let someTestClass: SomeTestClass;
  describe("Math functions", () => {
    describe("sum", () => {
      it("should sum correctly", () => {
        someTestClass = new SomeTestClass();
        const expectedResult = 3;
        expect(someTestClass.sum(1, 2)).toEqual(expectedResult);
      });
    });
  });
});
