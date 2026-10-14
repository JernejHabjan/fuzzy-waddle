import type { AiReservationV1 } from "../contracts/ai-dependency-contracts";
import { aiDeadline } from "../contracts/ai-core-types";
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
