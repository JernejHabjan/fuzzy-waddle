import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import { createAiProductionPolicyFixture } from "../testing/ai-production-policy-fixture";
import { planAiDecisions } from "./ai-decision-planner";

it("defers routine squad intake until a friendly move ends while retaining essential defense and lost-target recovery", () => {
  const f = createAiProductionPolicyFixture();
  const intent: AiIntentV1 = {
    kind: "move",
    intentId: "intent:rally",
    effectId: "effect:rally",
    planId: "plan:squad:reserve:home",
    demandId: null,
    lane: "army_threat",
    proposedTick: 200,
    urgencyClass: 1,
    utility: 10,
    preconditions: [],
    claims: [],
    reasonCode: "reserve",
    actorIds: [f.producer.actorId],
    logicalPosition: { x: 0, y: 0, z: 0 }
  };
  const moving = {
    ...f.producer,
    activeOrder: {
      status: "known" as const,
      observedTick: 200,
      value: { orderType: OrderType.Move, targetActorId: "rally" }
    }
  };
  const target = { ...f.producer, actorId: "rally" };
  const observation = { ...f.observation, actors: [moving, target] };
  const run = (current = observation, next = intent) =>
    planAiDecisions(
      current,
      f.state,
      [],
      [{ managerId: "squad", lane: "army_threat", evaluated: true, intents: [next], reasons: [] }],
      f.profile
    );
  expect(run().proposals).toEqual([]);
  expect(run().preDecisions[0]).toMatchObject({ outcome: "rejected", detail: "friendly_rally_in_progress" });
  expect(run(observation, { ...intent, planId: "plan:squad:defense:home" }).proposals).toEqual([
    { ...intent, planId: "plan:squad:defense:home" }
  ]);
  expect(run({ ...observation, actors: [moving] }).proposals).toEqual([intent]);
  const idle = { ...moving, activeOrder: { ...moving.activeOrder, value: null } };
  expect(run({ ...observation, actors: [idle, target] }).proposals).toEqual([intent]);
});
