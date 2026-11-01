import { validAiRuntimeBrainFault } from "./ai-runtime-brain-fault";

it("requires a finite explicitly owned fault window and a known boundary", () => {
  const fault = { kind: "debug", playerNumber: 2, fromTick: 200, throughTick: 800 };
  expect(validAiRuntimeBrainFault(undefined)).toBe(true);
  for (const kind of ["throw", "nan", "cost", "debug", "mandatory"])
    expect(validAiRuntimeBrainFault({ ...fault, kind })).toBe(true);
  for (const patch of [{ playerNumber: 1 }, { fromTick: 0 }, { fromTick: NaN }, { throughTick: Infinity },
    { throughTick: 199 }, { throughTick: 1601 }, { kind: "unknown" }, { kind: {} }, { extra: true }])
    expect(validAiRuntimeBrainFault({ ...fault, ...patch })).toBe(false);
});
