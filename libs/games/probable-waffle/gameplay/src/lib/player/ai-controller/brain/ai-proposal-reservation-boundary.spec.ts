import type { AiReservationV1 } from "../contracts/ai-dependency-contracts";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import { aiDeadline } from "../contracts/ai-core-types";
import { ObjectNames, OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiProductionPolicyFixture } from "../testing/ai-production-policy-fixture";
import { AiMacroManager } from "../planning/ai-macro-manager";
import { PureAiBrain } from "./ai-brain";

it.each([0, 1])(
  "makes a builder eligible exactly at lease expiry, retaining live claims (remaining %s)",
  (remaining) => {
    const f = createAiProductionPolicyFixture();
    const reservations = f.observation.actors
      .filter((actor) => actor.actorId.startsWith("worker-"))
      .map(
        (actor) =>
          ({
            claimId: `claim:${actor.actorId}` as const,
            subjectKey: `actor:${actor.actorId}`,
            ownerPlanId: "plan:opening" as const,
            state: { kind: "provisional" as const, expiresAt: aiDeadline(f.observation.tick + remaining) },
            prerequisites: [],
            createdTick: 0
          }) satisfies AiReservationV1
      );
    const previous = { ...f.state, reservations };
    const manager = new AiMacroManager(() => f.catalog);
    const propose = jest.spyOn(manager, "propose");
    const result = new PureAiBrain(f.profile, [manager]).step(f.observation, previous, []);
    expect(propose.mock.calls[0]?.[1].reservations.length).toBe(remaining ? reservations.length : 0);
    expect(
      result.acceptedIntents.some((intent) => intent.kind === "construct" && intent.objectName === f.producerName)
    ).toBe(remaining === 0);
    expect(previous.reservations).toBe(reservations);
    expect(previous.reservations).toHaveLength(6);
  }
);

it("transfers a gatherer actor lease to accepted construction but retains the prior effect claim", () => {
  const f = createAiProductionPolicyFixture();
  const builderId = "worker-0";
  const actorClaimId = "claim:old-gatherer" as const;
  const oldEffectClaimId = "claim:old-gatherer:effect" as const;
  const worker = f.observation.actors.find((actor) => actor.actorId === builderId);
  if (!worker) throw new Error("ai_test_fixture_worker_missing");
  const observation = {
    ...f.observation,
    actors: f.observation.actors.map((actor) =>
      actor.actorId === builderId
        ? {
            ...actor,
            activeOrder: {
              status: "known" as const,
              observedTick: f.observation.tick,
              value: { orderType: OrderType.Gather, targetActorId: "wood-source" }
            },
            carriedResourceAmount: 0,
            resourceTransferInFlight: false
          }
        : actor
    )
  };
  const intent: AiIntentV1 = {
    kind: "construct",
    intentId: "intent:retask-construction",
    effectId: "effect:retask-construction",
    planId: "plan:construction:retask",
    demandId: null,
    lane: "optional_infrastructure_tech",
    proposedTick: observation.tick,
    urgencyClass: 4,
    utility: 590,
    preconditions: [{ kind: "actor_exists", actorId: builderId }],
    claims: [
      { claimId: "claim:new-builder", kind: "actor", actorId: builderId },
      { claimId: "claim:new-effect", kind: "effect", effectId: "effect:retask-construction" }
    ],
    reasonCode: "test:retask_gatherer",
    builderIds: [builderId],
    objectName: ObjectNames.Field,
    logicalPosition: { x: 8, y: 5, z: 0 },
    siteKey: "field:8,5"
  };
  const previous = {
    ...f.state,
    reservations: [
      {
        claimId: actorClaimId,
        subjectKey: `actor:${builderId}`,
        ownerPlanId: "plan:opening",
        state: { kind: "applied_spending" as const, appliedTick: observation.tick - 1 },
        prerequisites: [],
        createdTick: observation.tick - 10
      },
      {
        claimId: oldEffectClaimId,
        subjectKey: "effect:effect:old-gatherer",
        ownerPlanId: "plan:opening",
        state: { kind: "applied_spending" as const, appliedTick: observation.tick - 1 },
        prerequisites: [],
        createdTick: observation.tick - 10
      }
    ] satisfies AiReservationV1[]
  };
  const manager = {
    managerId: "retask-test",
    propose: () => ({
      managerId: "retask-test",
      lane: intent.lane,
      evaluated: true,
      intents: [intent],
      reasons: ["test:retask_gatherer"]
    })
  };

  const result = new PureAiBrain(f.profile, [manager]).step(observation, previous, []);

  expect(result.acceptedIntents).toContainEqual(intent);
  expect(result.nextState.reservations.map((reservation) => reservation.claimId)).toContain("claim:new-builder");
  expect(result.nextState.reservations.map((reservation) => reservation.claimId)).not.toContain(actorClaimId);
  expect(result.nextState.reservations.map((reservation) => reservation.claimId)).toContain(oldEffectClaimId);
});
