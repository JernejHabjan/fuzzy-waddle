// prettier-ignore
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";
import type { RuntimePresetWorldV1 } from "./skirmish-ai-runtime-preset-world";

/** Strict presets name concrete variants and retain every created identity and owned starting actor. */
export function assertRuntimePresetRoster(
  preset: RuntimePresetWorldV1,
  application: AiRuntimePresetApplicationV1,
  playerNumber: number,
  initial: { readonly ownedActorCount: number; readonly ownedActorNames: readonly string[] }
): void {
  if (!preset.requireFactionRoster) return;
  const sameNames = (left: readonly string[], right: readonly string[]) =>
    JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
  const ids = Object.values(application.createdActorIds);
  if (
    !sameNames(
      [...preset.actors, ...(preset.existingActorBindings ?? [])].map((actor) => actor.fixtureActorId),
      Object.keys(application.createdActorIds)
    ) ||
    ids.some((id) => !id) ||
    new Set(ids).size !== preset.actors.length + (preset.existingActorBindings?.length ?? 0) ||
    !sameNames(
      preset.actors.map((actor) => actor.actorName),
      application.createdActorNames
    )
  ) {
    throw new Error("runtime_preset_created_roster_mismatch");
  }
  const owned = [...preset.actors, ...(preset.existingActorBindings ?? [])]
    .filter((actor) => actor.owner === playerNumber)
    .map((actor) => actor.actorName);
  const remaining = [...initial.ownedActorNames];
  for (const name of owned) {
    const index = remaining.indexOf(name);
    if (index < 0) throw new Error(`runtime_preset_owned_actor_missing:${name}`);
    remaining.splice(index, 1);
  }
  if (initial.ownedActorCount !== initial.ownedActorNames.length)
    throw new Error("runtime_preset_owned_roster_count_mismatch");
}
