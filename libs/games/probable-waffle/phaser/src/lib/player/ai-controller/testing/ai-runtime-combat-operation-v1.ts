import type { AttackData } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/attack-data";
import type { StatusEffectData, StatusEffectType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { AiRuntimeCreatedActorV1 } from "./ai-runtime-created-actor-v1";

/** Native operation boundaries; a windup/cooldown is not damage, healing or status fulfillment. */
export type AiRuntimeCombatOperationV1 = {
  readonly actor: AiRuntimeCreatedActorV1;
  readonly actorTile: Vector2Simple | null;
  readonly clockTick: number | null;
  readonly sceneActive: boolean;
  readonly snapshotRestoreInProgress: boolean;
  readonly gaps: readonly string[];
} & (
  | { readonly kind: "attack_requested" | "attack_committed"; readonly target: AiRuntimeCreatedActorV1;
      readonly targetTile: Vector2Simple | null; readonly weapon: AttackData; readonly distance: number | null;
      readonly highGroundRangeBonus: number; readonly targetFlying: boolean; readonly stunned: boolean }
  | { readonly kind: "heal_returned"; readonly target: AiRuntimeCreatedActorV1;
      readonly beforeHealth: number | null; readonly afterHealth: number | null }
  | { readonly kind: "health_healed"; readonly beforeHealth: number; readonly afterHealth: number }
  | { readonly kind: "status_applied"; readonly effect: StatusEffectData }
  | { readonly kind: "status_removed"; readonly effectType: StatusEffectType }
  | { readonly kind: "spell_cooldown_started"; readonly spellType: string }
);
