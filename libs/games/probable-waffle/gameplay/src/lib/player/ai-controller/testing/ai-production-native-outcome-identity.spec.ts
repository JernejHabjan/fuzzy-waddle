import { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCommandOutcomeV1 } from "../contracts/ai-command-contracts";
import { PureAiBrain } from "../brain/ai-brain";
import { AiMacroManager } from "../planning/ai-macro-manager";
import { reconcileAiCommandReservations } from "../planning/reconcile-ai-command-reservations";
import { unresolvedReservedEffectIds } from "../planning/ai-macro-effect-identity";
import { createAiProductionPolicyFixture } from "./ai-production-policy-fixture";

describe.each([FactionType.Tivara, FactionType.Skaduwee])("native outcome production identity %s", (faction) => {
  it("releases the exact completed work despite the adapter's canonical effect prefix", () => {
    const f = createAiProductionPolicyFixture(faction);
    const brain = new PureAiBrain(f.profile, [new AiMacroManager(() => f.catalog)]);
    const first = brain.step(f.observation, f.state, []);
    const admitted = brain.step({ ...f.observation, tick: 390 }, first.nextState, []);
    const unit = admitted.acceptedIntents.find((intent) => intent.kind === "produce");
    if (!unit) throw new Error("production_identity_unit_missing");
    const outcome: AiCommandOutcomeV1 = {
      kind: "completed",
      tick: 400,
      resultingActorIds: [],
      worldLinkIds: ["spawn"],
      identity: {
        matchId: "native-production",
        authorityEpoch: 0,
        playerNumber: 1,
        sequence: 1,
        commandId: "command:production",
        effectId: `effect:${unit.effectId.replace(/^effect:/, "")}`,
        intentId: `intent:${unit.intentId.replace(/^intent:/, "")}`
      }
    };
    const original = admitted.nextState.reservations;
    const stem = unit.claims.find((claim) => claim.kind === "production_slot")?.claimId;
    if (!stem) throw new Error("production_identity_slot_missing");
    expect(original.some((claim) => claim.claimId === stem)).toBe(true);
    const remaining = reconcileAiCommandReservations(original, [outcome]);
    expect(remaining.some((claim) => claim.claimId === stem)).toBe(false);
    expect(remaining.filter((claim) => !claim.claimId.startsWith(stem))).toEqual(
      original.filter((claim) => !claim.claimId.startsWith(stem))
    );
    const state = { ...admitted.nextState, pendingOutcomes: [outcome] };
    expect(unresolvedReservedEffectIds(state, "effect:composition:")).not.toContain(unit.effectId);
  });
});
