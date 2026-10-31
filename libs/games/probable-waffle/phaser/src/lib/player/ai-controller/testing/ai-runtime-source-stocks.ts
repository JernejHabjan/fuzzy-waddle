import type Phaser from "phaser";
import { getActorComponent } from "../../../data/actor-component";
import { ResourceSourceComponent } from "../../../entity/components/resource/resource-source-component";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";

/** Strict, bounded pre-tick source stock setup; never changes definitions, harvest factors or live AI state. */
export function validAiRuntimeSourceStocks(value: unknown, actorIds: ReadonlySet<string>): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > 32) return false;
  const seen = new Set<string>();
  return value.every((entry) => {
    if (
      !entry ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      Object.keys(entry).some((key) => !["fixtureActorId", "amount"].includes(key))
    )
      return false;
    const { fixtureActorId, amount } = entry;
    if (
      typeof fixtureActorId !== "string" ||
      !actorIds.has(fixtureActorId) ||
      seen.has(fixtureActorId) ||
      !Number.isSafeInteger(amount) ||
      amount < 0 ||
      amount > 100000
    )
      return false;
    seen.add(fixtureActorId);
    return true;
  });
}

/** Apply saved-component stock authority before orders/ticks; reject over-max requests instead of silently clamping. */
export function applyAiRuntimeSourceStocks(
  preset: AiRuntimePresetWorldV1,
  actors: ReadonlyMap<string, Phaser.GameObjects.GameObject>
): void {
  for (const stock of preset.sourceStocks ?? []) {
    const actor = actors.get(stock.fixtureActorId);
    const source = actor ? getActorComponent(actor, ResourceSourceComponent) : undefined;
    if (!source || stock.amount > source.getMaximumResources())
      throw new Error(`runtime_preset_source_stock_invalid:${stock.fixtureActorId}`);
    source.setData({ currentResources: stock.amount });
  }
}
