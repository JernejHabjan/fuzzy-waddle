import type Phaser from "phaser";
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import { hasOnlyKeys, isRecord } from "./ai-runtime-fixture-values";

/** Initial damaged-unit controls use real saved component durability, never counterfeit combat callbacks. */
export function validAiRuntimeHealthStarts(value: unknown, actorIds: ReadonlySet<string>): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > 32) return false;
  const seen = new Set<string>();
  return value.every((entry) => {
    if (!isRecord(entry) || !hasOnlyKeys(entry, ["fixtureActorId", "healthPermille", "armourPermille"])) return false;
    const id = entry["fixtureActorId"], health = entry["healthPermille"], armour = entry["armourPermille"];
    if (typeof id !== "string" || !actorIds.has(id) || seen.has(id) || typeof health !== "number" ||
        !Number.isSafeInteger(health) || health < 1 || health > 1000 || typeof armour !== "number" ||
        !Number.isSafeInteger(armour) || armour < 0 || armour > 1000) return false;
    seen.add(id);
    return true;
  });
}

/** Called before queues, orders and the first observation. Zero/dead setups are deliberately unsupported. */
export function applyAiRuntimeHealthStarts(
  preset: AiRuntimePresetWorldV1, actors: ReadonlyMap<string, Phaser.GameObjects.GameObject>
): void {
  for (const start of preset.healthStarts ?? []) {
    const actor = actors.get(start.fixtureActorId), health = actor && getActorComponent(actor, HealthComponent);
    if (!health?.alive) throw new Error(`runtime_preset_health_actor_missing:${start.fixtureActorId}`);
    health.setData({
      health: Math.max(1, Math.floor(health.healthDefinition.maxHealth * start.healthPermille / 1000)),
      armour: Math.floor((health.healthDefinition.maxArmour ?? 0) * start.armourPermille / 1000)
    });
  }
}
