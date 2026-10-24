import { validAiRuntimeReceiptFault } from "./ai-runtime-receipt-fault";

const original = { id: "original-receipt", playerNumber: 2, fromTick: 1, throughTick: 800,
  maximumCommands: 1, commandKind: "production" };

it("requires explicit bounded consumer ownership and finite simulation deadlines", () => {
  expect(validAiRuntimeReceiptFault(undefined)).toBe(true);
  expect(validAiRuntimeReceiptFault(original)).toBe(true);
  for (const patch of [{ playerNumber: 1 }, { fromTick: 0 }, { fromTick: NaN }, { throughTick: Infinity },
    { throughTick: 4001 }, { throughTick: 0 }, { throughTick: 3002 }, { maximumCommands: 129 },
    { maximumCommands: 0 }, { maximumCommands: 1.5 }, { commandKind: "all" }, { holdHistory: false },
    { destroyOutput: "true" }, { commandKind: "any", contendQueue: true }, { unknown: true }])
    expect(validAiRuntimeReceiptFault({ ...original, ...patch })).toBe(false);
});

it("permits original production death/contention controls and explicit unavailable-history pressure", () => {
  expect(validAiRuntimeReceiptFault({ ...original, destroyOutput: true })).toBe(true);
  expect(validAiRuntimeReceiptFault({ ...original, contendQueue: true })).toBe(true);
  expect(validAiRuntimeReceiptFault({ ...original, commandKind: "any", maximumCommands: 128, holdHistory: true })).toBe(true);
});
