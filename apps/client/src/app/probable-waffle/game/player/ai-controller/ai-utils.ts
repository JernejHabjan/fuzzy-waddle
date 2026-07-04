import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { getPwActorDefinition } from "../../prefabs/definitions/actor-definitions";
import { getActorComponent } from "../../data/actor-component";
import { AttackComponent } from "../../entity/components/combat/components/attack-component";
import { getResearchedLevelForActor } from "../../data/actor-level-utils";
import GameObject = Phaser.GameObjects.GameObject;

export function getUnitStrength(unit: GameObject): number {
  const definition = getPwActorDefinition(unit.name, getResearchedLevelForActor(unit));
  if (!definition) return 1; // default strength

  const cost = definition.components?.productionCost?.resources;
  const totalCost = cost ? Object.values(cost).reduce((a, b) => a + b, 0) : 0;

  const health = getActorComponent(unit, HealthComponent)?.healthDefinition.maxHealth ?? 0;

  const attack = getActorComponent(unit, AttackComponent);
  const attackData = attack?.getAttacks()[0]; // simplified: using first attack
  const dps = attackData ? attackData.damage / (attackData.cooldown / 1000) : 0;

  // Simple weighting. Can be adjusted.
  return totalCost + health + dps * 10;
}
