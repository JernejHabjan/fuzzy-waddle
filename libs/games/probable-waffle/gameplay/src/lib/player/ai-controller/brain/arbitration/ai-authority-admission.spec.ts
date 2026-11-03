import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainState } from "../state/create-ai-brain-state";
import { createAiProfileConfig } from "../../profiles/ai-profile-defaults";
import { createAiTestObservation } from "../../testing/fixtures/coordination/ai-test-fixtures";
import type { AiIntent } from "../../contracts/commands/ai-intent";
import { arbitrateAiIntents } from "./ai-intent-arbiter";

it.each([0, 1, 2])("admits at most the remaining %s authoritative command slots", (remaining) => {
  const profile = createAiProfileConfig(ProbableWaffleAiDifficulty.Medium);
  const initial = createAiBrainState({ playerNumber: 1, faction: FactionType.Tivara, profile, tick: 0, archetypeId: "balanced" });
  const pendingCommandIds = Array.from({ length: 2 - remaining }, (_, index) => `command:pending-${index}` as const);
  const state = { ...initial, authority: { ...initial.authority, pendingLimit: 2, pendingCommandIds } };
  const proposals = Array.from({ length: 3 }, (_, index): AiIntent => ({ kind: "stop", actorIds: ["worker-1"],
    intentId: `intent:${index}`, effectId: `effect:${index}`, planId: "plan:opening", demandId: null,
    lane: "essential_economy", proposedTick: 20, urgencyClass: 0, utility: 900 - index,
    preconditions: [], claims: [], reasonCode: "bounded-command-service" }));
  const result = arbitrateAiIntents(createAiTestObservation(), state, proposals, [], profile, undefined);
  expect(result.accepted).toHaveLength(remaining);
  expect(result.decisions.filter((decision) => decision.outcome === "rejected" &&
    decision.detail === "authority_backpressure")).toHaveLength(3 - remaining);
  expect(state.authority.pendingCommandIds).toEqual(pendingCommandIds);
});
