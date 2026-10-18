import { validAiRuntimeProtectedRoutes } from "./validate-ai-runtime-protected-routes";

const route = { id: "worker-service", playerNumber: 2, from: { x: 100, y: 200 }, to: { x: 200, y: 400 }, tileMargin: 0 };

describe("bounded placement route declarations", () => {
  it("accepts fixed owned endpoints without injected routes or verdicts", () => {
    expect(validAiRuntimeProtectedRoutes([route], new Set([2]))).toBe(true);
    expect(validAiRuntimeProtectedRoutes(undefined, new Set())).toBe(true);
  });

  it("rejects duplicate, unowned, degenerate, unbounded or verdict-bearing inputs", () => {
    for (const input of [
      [], [route, route], [{ ...route, playerNumber: 1 }], [{ ...route, tileMargin: 3 }],
      [{ ...route, tileMargin: 0.5 }], [{ ...route, from: { x: Number.NaN, y: 10 } }],
      [{ ...route, to: { y: 200, x: 100 } }], [{ ...route, path: [{ x: 1, y: 2 }] }],
      [{ ...route, from: { x: 100, y: 200, safe: true } }],
      Array.from({ length: 9 }, (_, index) => ({ ...route, id: `route-${index}` }))
    ]) expect(validAiRuntimeProtectedRoutes(input, new Set([2]))).toBe(false);
  });
});
