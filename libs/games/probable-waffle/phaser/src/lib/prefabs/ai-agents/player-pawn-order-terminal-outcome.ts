export type PlayerPawnOrderTerminalClassification = {
  kind: "completed" | "cancelled" | "failed";
  reason: "applied" | "cancelled" | "application_failed";
};

const completedOrderReasons = new Set([
  "EnterContainer:AlreadyLoaded",
  "EnterContainer:Boarded",
  "EnterContainer:MovedToShore",
  "Attack - Target Not Alive",
  "Move - Reached Target",
  "Stop - Order Complete",
  "Gather - No Resources Exist",
  "Repair - Target Health Full",
  "Heal - Target Health Full"
]);

/** Keeps command reconciliation conservative when behavior-tree stop reasons evolve. */
export const classifyPlayerPawnOrderTerminalOutcome = (reason: string): PlayerPawnOrderTerminalClassification => {
  if (/cancel/i.test(reason)) {
    return { kind: "cancelled", reason: "cancelled" };
  }
  if (completedOrderReasons.has(reason)) {
    return { kind: "completed", reason: "applied" };
  }
  return { kind: "failed", reason: "application_failed" };
};
