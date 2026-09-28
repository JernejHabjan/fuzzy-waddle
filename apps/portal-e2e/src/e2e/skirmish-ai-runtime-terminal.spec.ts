import { expect, test } from "@playwright/test";
import { canStopAfterTerminal, isAiVictory } from "./skirmish-ai-runtime-terminal";

const assertions = {
  "SEQ-01": { requireAiVictory: true },
  "PRO-01": { requireAiVictory: false }
};

test("victory accepts only the AI player's authoritative win", () => {
  expect(isAiVictory({ gameResult: "win" })).toBe(true);
  for (const gameResult of [null, "loss", "tie", "quit"]) {
    expect(isAiVictory({ gameResult })).toBe(false);
  }
});

test("a terminal match may stop after all selected terminal assertions and events", () => {
  expect(canStopAfterTerminal(assertions, ["SEQ-01"], { tick: 600, gameResult: "win" }, [500])).toBe(true);
  expect(canStopAfterTerminal(assertions, ["SEQ-01"], { tick: 600, gameResult: "loss" }, [])).toBe(true);
  expect(canStopAfterTerminal(assertions, ["SEQ-01"], { tick: 600, gameResult: null }, [])).toBe(false);
  expect(canStopAfterTerminal(assertions, ["SEQ-01"], { tick: 600, gameResult: "win" }, [700])).toBe(false);
});

test("shared production and victory variants retain the production observation horizon", () => {
  expect(canStopAfterTerminal(assertions, ["SEQ-01", "PRO-01"], { tick: 600, gameResult: "win" }, [])).toBe(false);
});
