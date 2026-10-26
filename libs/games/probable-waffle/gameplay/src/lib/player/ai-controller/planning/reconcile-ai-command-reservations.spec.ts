import type { AiCommandOutcomeV1 } from "../contracts/ai-command-contracts";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiReservationV1 } from "../contracts/ai-dependency-contracts";
import { reconcileAiCommandReservations } from "./reconcile-ai-command-reservations";

describe("reconcileAiCommandReservations", () => {
  const reservations: AiReservationV1[] = [
    {
      claimId: "food-labor:claim:13:0" as AiReservationV1["claimId"],
      subjectKey: "actor:worker-1",
      ownerPlanId: "plan:opening" as AiReservationV1["ownerPlanId"],
      state: { kind: "provisional", expiresAt: aiDeadline(240) },
      prerequisites: [],
      createdTick: 80
    },
    {
      claimId: "food-labor:claim:13:0:effect" as AiReservationV1["claimId"],
      subjectKey: "effect:food-labor:effect:13:0",
      ownerPlanId: "plan:opening" as AiReservationV1["ownerPlanId"],
      state: { kind: "provisional", expiresAt: aiDeadline(240) },
      prerequisites: [],
      createdTick: 80
    }
  ];
  const outcome = (kind: AiCommandOutcomeV1["kind"], tick: number): AiCommandOutcomeV1 => ({
    kind,
    tick,
    identity: {
      matchId: "match" as AiCommandOutcomeV1["identity"]["matchId"],
      authorityEpoch: 1,
      playerNumber: 2,
      sequence: 17,
      commandId: "command:gather-1" as AiCommandOutcomeV1["identity"]["commandId"],
      effectId: "effect:food-labor:effect:13:0" as AiCommandOutcomeV1["identity"]["effectId"],
      intentId: "intent:food-labor:intent:13:0" as AiCommandOutcomeV1["identity"]["intentId"]
    },
    ...(kind === "applied" ? { worldLinkIds: [] } : {}),
    ...(kind === "active" ? { actorIds: ["worker-1"] } : {}),
    ...(kind === "completed" ? { resultingActorIds: [] } : {}),
    ...(kind === "failed" || kind === "rejected" || kind === "cancelled" ? { reason: "native failure" } : {})
  } as AiCommandOutcomeV1);

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
