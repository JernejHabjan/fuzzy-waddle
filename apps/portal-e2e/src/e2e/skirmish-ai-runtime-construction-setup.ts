import type { RuntimePresetWorldV1 } from "./skirmish-ai-runtime-preset-world";
// prettier-ignore
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";

/** Refuse a lost/rewritten browser binding even when a fixture label and construction count happen to match. */
export function assertRuntimeConstructionSetup(
  preset: RuntimePresetWorldV1,
  application: AiRuntimePresetApplicationV1
): void {
  const orders = preset.constructionOrders ?? [];
  const applied = application.constructionApplications ?? [];
  if (orders.length !== applied.length || new Set(applied.map((entry) => entry.fixtureActorId)).size !== applied.length) {
    throw new Error("runtime_construction_setup_count_mismatch");
  }
  for (const order of orders) {
    const entry = applied.find((candidate) => candidate.fixtureActorId === order.fixtureActorId);
    const builders = order.builderFixtureActorIds.map((id) => application.createdActorIds[id]);
    const owner = [...preset.actors, ...(preset.existingActorBindings ?? [])].find(
      (actor) => actor.fixtureActorId === order.builderFixtureActorIds[0]
    )?.owner;
    if (!entry || !entry.command.execution || !entry.siteActorId ||
        entry.siteActorId !== application.createdActorIds[order.fixtureActorId] ||
        entry.command.actorName !== order.actorName || entry.command.playerNumber !== owner ||
        builders.some((id) => !id) || JSON.stringify(entry.command.actorIds) !== JSON.stringify(builders) ||
        !entry.outcomes.some((outcome) => outcome.kind === "applied" && outcome.worldLinkIds.includes(entry.siteActorId)) ||
        entry.outcomes.some((outcome) => outcome.commandId !== entry.command.execution?.commandId ||
          outcome.playerNumber !== owner || outcome.kind === "failed" || outcome.kind === "rejected")) {
      throw new Error(`runtime_construction_setup_identity_mismatch:${order.fixtureActorId}`);
    }
  }
}
