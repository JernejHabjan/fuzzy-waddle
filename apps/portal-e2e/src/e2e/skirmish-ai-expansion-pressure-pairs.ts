import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { validExpansionPressureRecipe } from "../../../../tools/ai/skirmish-runtime-expansion-pressure-fixture.mjs";
import { evaluateExpansionWorld } from "./skirmish-ai-expansion-world-evaluation";
import { expansionHomeDanger } from "./skirmish-ai-expansion-home-danger";
import { expansionServiceFailures } from "./skirmish-ai-expansion-service-evaluation";

/** Full-case pair presence and aligned positive action prevent absent expansion demand from impersonating suppression. */
export function evaluateExpansionPressurePairs(fixture: RuntimeFixtureV1, results: readonly RuntimeVariantResultV1[]): string[] {
  const assertion = fixture.assertions["EXP-02"], contract = assertion?.requiredExpansionPressure;
  if (!assertion || !contract || !validExpansionPressureRecipe(fixture.recipe, assertion, "EXP-02")) {
    return ["expansion_pressure_binding_invalid"];
  }
  const failures: string[] = [];
  for (const variant of fixture.recipe.variants) {
    const found = results.filter((result) => result.variantId === variant.id);
    if (found.length !== 1 || found[0]?.aiFaction !== variant.aiFaction ||
        found[0]?.presetFixtureId !== variant.presetWorld?.fixtureId) {
      failures.push(`expansion_pressure_variant_missing:${variant.id}`);
    }
  }
  for (const faction of assertion.requiredAiFactions) {
    const safe = results.find((result) => result.aiFaction === faction && contract.branchByVariant[result.variantId] === "expand");
    if (!safe || evaluateExpansionWorld("expand", safe, safe.opponentCapture).length) {
      failures.push(`expansion_pressure_productive_safe_pair_missing:${faction}`);
      continue;
    }
    for (const subject of results.filter((result) => result.aiFaction === faction &&
      ["home_pressure", "pressure_withdrawn", "combat_resolved"].includes(contract.branchByVariant[result.variantId] ?? "")
    )) {
      if (subject.seed !== safe.seed) failures.push(`expansion_pressure_actual_pair_seed_mismatch:${subject.variantId}`);
      const raiderIds = Object.entries(subject.presetCreatedActorIds).filter(([role]) => role.startsWith("home-raider"))
        .map(([, id]) => id);
      const homeId = subject.presetCreatedActorIds["original-home"];
      const dangerTicks = subject.productionCapture && homeId
        ? expansionHomeDanger(subject.productionCapture, homeId, raiderIds).map(({ fact }) => fact.tick) : [];
      const safeSourceId = safe.presetCreatedActorIds["safe-source"];
      const choice = safe.productionCapture?.facts.some((fact) => {
        if (fact.kind !== "decision_selected" || !dangerTicks.includes(fact.tick)) {
          return false;
        }
        const source = fact.decision.input?.observation?.actors.find((actor) => actor.actorId === safeSourceId);
        if (source?.logicalPosition.status !== "known") return false;
        const position = source.logicalPosition.value;
        return fact.decision.acceptedIntents.some((intent) => intent.kind === "construct" &&
          ["WorkMill", "Sandhold", "FrostForge"].includes(intent.objectName) &&
          Math.abs(intent.logicalPosition.x - position.x) + Math.abs(intent.logicalPosition.y - position.y) <= 12 &&
          safe.productionCapture?.facts.some((placement) => {
            if (placement.kind !== "spatial_authority" || placement.spatial.kind !== "placement" ||
                placement.sequence <= fact.sequence) return false;
            const siteId = placement.spatial.site.actorId, command = placement.spatial.command.execution;
            const builderId = intent.builderIds[0];
            return !!siteId && !!builderId && command?.source === "ai" && command.effectId === intent.effectId &&
              expansionServiceFailures(safe, siteId, command.commandId, builderId).length === 0;
          })
        );
      });
      if (!choice) failures.push(`expansion_pressure_safe_pair_has_no_action_during_danger_window:${subject.variantId}`);
    }
  }
  return failures;
}
