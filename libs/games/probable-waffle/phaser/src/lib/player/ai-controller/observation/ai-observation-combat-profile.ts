import type { AiDomainV1, AiObservedActorV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { getActorComponent } from "../../../data/actor-component";
import type { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { AttackComponent } from "../../../entity/components/combat/components/attack-component";
import { HealingComponent } from "../../../entity/components/combat/components/healing-component";
import { SpellComponent } from "../../../entity/components/combat/components/spell-component";
import { StatusEffectComponent } from "../../../entity/components/status-effect/status-effect-component";
import { spellDefinitions } from "../../../entity/components/combat/spell-definitions";
import { knownValue, millisecondsToSimulationTicks, uniqueDomain, unknownValue } from "./ai-observation-values";
import Phaser from "phaser";

export function projectAiCombatProfile(
  actor: Phaser.GameObjects.GameObject,
  definition: ReturnType<typeof getPwActorDefinition>,
  owned: boolean,
  visibility: AiObservedActorV1["visibility"],
  tick: number
): AiObservedActorV1["combatProfile"] {
  const health = getActorComponent(actor, HealthComponent);
  const attack = getActorComponent(actor, AttackComponent);
  const healing = getActorComponent(actor, HealingComponent);
  const spell = getActorComponent(actor, SpellComponent);
  const statusEffects = getActorComponent(actor, StatusEffectComponent);
  return health && (owned || visibility === "visible")
    ? knownValue(
        {
          maxHealth: health.healthDefinition.maxHealth,
          maxArmour: health.healthDefinition.maxArmour ?? 0,
          passiveRegenerationPerSecond: definition?.components?.healthRegeneration?.regenerateHealthRate ?? 0,
          armourPermille: Math.max(
            0,
            Math.min(
              1000,
              Math.floor(
                (health.healthComponentData.armour / Math.max(1, health.healthDefinition.maxArmour ?? 0)) * 1000
              )
            )
          ),
          attacks: (attack?.getAttacks() ?? definition?.components?.attack?.attacks ?? []).map((entry) => ({
            damage: entry.damage,
            cooldownTicks: millisecondsToSimulationTicks(entry.cooldown),
            remainingCooldownTicks: owned && attack ? millisecondsToSimulationTicks(attack.remainingCooldown) : null,
            range: entry.range,
            minRange: entry.minRange,
            highGroundRangeBonus: entry.highGroundRangeBonus ?? 0,
            impactDelayTicks: millisecondsToSimulationTicks(entry.delays.hit),
            areaRadius: entry.meleeAoe?.range ?? 0,
            targetDomains: entry.canTargetAir ? (["ground", "water", "air"] as const) : (["ground", "water"] as const)
          })),
          healing:
            healing && owned
              ? {
                  amount: healing.healingDefinition.healPerCooldown,
                  cooldownTicks: millisecondsToSimulationTicks(healing.healingDefinition.cooldown),
                  remainingCooldownTicks: millisecondsToSimulationTicks(healing.remainingCooldown),
                  range: healing.healingDefinition.range
                }
              : null,
          spells:
            spell && owned
              ? spell.availableSpells
                  .map((spellType) => {
                    const data = spellDefinitions[spellType];
                    if (!data) return undefined;
                    return {
                      spellType,
                      ready: spell.canCastSpell(spellType),
                      researched: spell.isSpellResearched(spellType),
                      autocast: spell.isAutocastEnabled(spellType),
                      range: data.range,
                      areaRadius: data.aoeRadius,
                      targetAllies: data.targetAllies,
                      targetEnemies: data.targetEnemies,
                      targetSelf: data.targetSelf,
                      targetDomains: (data.targetDomains ?? ["land", "water", "air"])
                        .map((domain): AiDomainV1 => (domain === "land" ? "ground" : domain))
                        .filter(uniqueDomain),
                      instantDamage: data.instantDamage ?? 0,
                      periodicDamage:
                        Math.max(0, data.dotDamage ?? 0) *
                        Math.max(1, Math.floor((data.dotDuration ?? 0) / Math.max(1, data.dotTickInterval ?? 1))),
                      instantHeal: data.instantHeal ?? 0,
                      periodicHeal:
                        Math.max(0, data.hotHeal ?? 0) *
                        Math.max(1, Math.floor((data.hotDuration ?? 0) / Math.max(1, data.hotTickInterval ?? 1))),
                      stunTicks: millisecondsToSimulationTicks(data.stunDuration ?? 0),
                      slowTicks: millisecondsToSimulationTicks(data.slowDuration ?? 0),
                      zoneDurationTicks: millisecondsToSimulationTicks(data.persistentZone?.duration ?? 0),
                      summons: data.spawnPrefab !== undefined,
                      summonDurationTicks: data.spawnPrefab
                        ? data.spawnPrefab.duration === undefined
                          ? null
                          : millisecondsToSimulationTicks(data.spawnPrefab.duration)
                        : null
                    };
                  })
                  .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined)
                  .sort((left, right) => left.spellType.localeCompare(right.spellType))
              : [],
          statuses: (statusEffects?.getActiveEffects() ?? [])
            .map((effect) => ({
              type: effect.type,
              remainingTicks: millisecondsToSimulationTicks(effect.remainingTime),
              movementSpeedPermille: Math.max(
                100,
                Math.min(2000, Math.floor((effect.movementSpeedModifier ?? 1) * 1000))
              )
            }))
            .sort((left, right) => left.type.localeCompare(right.type))
        },
        tick
      )
    : unknownValue(owned ? "not_supported" : "not_observed");
}
