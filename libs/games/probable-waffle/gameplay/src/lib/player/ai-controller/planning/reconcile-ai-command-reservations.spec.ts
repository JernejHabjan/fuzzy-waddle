import type { AiCommandOutcome } from "../contracts/ai-command-contracts";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiReservation } from "../contracts/ai-dependency-contracts";
import { reconcileAiCommandReservations } from "./reconcile-ai-command-reservations";

describe("reconcileAiCommandReservations", () => {
  const reservations: AiReservation[] = [
    {
      claimId: "food-labor:claim:13:0" as AiReservation["claimId"],
      subjectKey: "actor:worker-1",
      ownerPlanId: "plan:opening" as AiReservation["ownerPlanId"],
      state: { kind: "provisional", expiresAt: aiDeadline(240) },
      prerequisites: [],
      createdTick: 80
    },
    {
      claimId: "food-labor:claim:13:0:effect" as AiReservation["claimId"],
      subjectKey: "effect:food-labor:effect:13:0",
      ownerPlanId: "plan:opening" as AiReservation["ownerPlanId"],
      state: { kind: "provisional", expiresAt: aiDeadline(240) },
      prerequisites: [],
      createdTick: 80
    }
  ];
  const outcome = (kind: AiCommandOutcome["kind"], tick: number): AiCommandOutcome => ({
    kind,
    tick,
    identity: {
      matchId: "match" as AiCommandOutcome["identity"]["matchId"],
      authorityEpoch: 1,
      playerNumber: 2,
      sequence: 17,
      commandId: "command:gather-1" as AiCommandOutcome["identity"]["commandId"],
      effectId: "effect:food-labor:effect:13:0" as AiCommandOutcome["identity"]["effectId"],
      intentId: "intent:food-labor:intent:13:0" as AiCommandOutcome["identity"]["intentId"]
    },
    ...(kind === "applied" ? { worldLinkIds: [] } : {}),
    ...(kind === "active" ? { actorIds: ["worker-1"] } : {}),
    ...(kind === "completed" ? { resultingActorIds: [] } : {}),
    ...(kind === "failed" || kind === "rejected" || kind === "cancelled" ? { reason: "native failure" } : {})
  } as AiCommandOutcome);

  it("keeps every accepted intent claim dispatched until its terminal receipt arrives", () => {
    const dispatched = reconcileAiCommandReservations(reservations, [outcome("dispatched", 80)]);
    expect(dispatched.map((reservation) => reservation.state)).toEqual([
      { kind: "dispatched", commandId: "command:gather-1" },
      { kind: "dispatched", commandId: "command:gather-1" }
    ]);

    const stillOwned = reconcileAiCommandReservations(dispatched, []);
    expect(stillOwned).toEqual(dispatched);

    expect(reconcileAiCommandReservations(stillOwned, [outcome("failed", 88)])).toEqual([]);
  });
});
