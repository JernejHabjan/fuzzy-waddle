import Phaser from "phaser";
import { State } from "mistreevous";
import { getActorComponent } from "../../data/actor-component";
import { PawnAiController } from "../../prefabs/ai-agents/pawn-ai-controller";
import { OrderData } from "../../ai/OrderData";
import { OrderType } from "../../ai/order-type";
import { isGameObjectActiveInActiveScene } from "../../data/game-object-helper";
import { DistanceHelper } from "../../library/distance-helper";
import { AI_CONFIG } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/ai-config";
import { getUnitStrength } from "./ai-utils";
import { dispatchAiOrder } from "./dispatch-ai-order";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { isEnemyPlayerWeak } from "./ai-static-decisions";
import { queryAiAccessRouteV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { PlayerAiEconomyAgent } from "./player-ai-economy-agent";

type GameObject = Phaser.GameObjects.GameObject;
/** Retains legacy combat and strategic actions on the shared agent context. */
export class PlayerAiCombatAgent extends PlayerAiEconomyAgent {
  IsBaseUnderAttack() {
    const underAttack = this.blackboard.enemiesNearBase.length > 0;
    if (underAttack) {
      this.logDebugInfo(`[Combat] Base under attack! Enemies near base: ${this.blackboard.enemiesNearBase.length}`);
    }
    return underAttack;
  }

  IsBaseUnderHeavyAttack() {
    const threshold = this.adaptiveThresholds.getBaseHeavyAttackThreshold();
    const enemyCount = this.blackboard.enemiesNearBase.length;
    const underHeavyAttack = enemyCount > threshold;
    if (underHeavyAttack) {
      this.logDebugInfo(`[Combat] Base under HEAVY attack! ${enemyCount} enemies (threshold: ${threshold})`);
    }
    return underHeavyAttack;
  }

  HasEnoughMilitaryPower() {
    // Unit discovery manager keeps units list current; no temp reassignment
    const thresholdStrength = this.adaptiveThresholds.getMilitaryPowerStrengthThreshold();
    const unitStrength = this.blackboard.units.reduce((sum, u) => sum + getUnitStrength(u), 0);
    const hasEnough = unitStrength >= thresholdStrength;
    this.logDebugInfo(
      `[Military] Power check: ${unitStrength} strength vs threshold strength ${thresholdStrength} = ${hasEnough ? "SUFFICIENT" : "INSUFFICIENT"}`
    );
    return hasEnough;
  }

  AssignDefendersToEnemies() {
    if (this.blackboard.defendingUnits.length > 0 && this.blackboard.enemiesNearBase.length > 0) {
      this.logDebugInfo(
        `[Defense] Assigning ${this.blackboard.defendingUnits.length} defenders to engage ${this.blackboard.enemiesNearBase.length} enemies`
      );
      let assignedCount = 0;
      this.blackboard.defendingUnits.forEach((unit) => {
        const aiController = getActorComponent(unit, PawnAiController);
        if (!aiController) return;
        if (aiController.blackboard.getCurrentOrder()) return; // currently busy
        // Target closest enemy near base
        let closestEnemy: GameObject | null = null;
        let closestDist = Infinity;
        this.blackboard.enemiesNearBase.forEach((enemy) => {
          if (!isGameObjectActiveInActiveScene(unit) || !isGameObjectActiveInActiveScene(enemy)) return;
          const d = DistanceHelper.getTileDistanceBetweenGameObjects(unit, enemy);
          if (d === null) {
            return;
          }
          if (d < closestDist) {
            closestDist = d;
            closestEnemy = enemy;
            return;
          }
          if (d === closestDist && closestEnemy) {
            const closestId = getActorComponent(closestEnemy, IdComponent)?.id ?? "";
            const candidateId = getActorComponent(enemy, IdComponent)?.id ?? "";
            if (closestId && candidateId && candidateId.localeCompare(closestId) < 0) {
              closestEnemy = enemy;
            }
          }
        });
        if (!closestEnemy) return;
        const newOrder = new OrderData(OrderType.Attack, { targetGameObject: closestEnemy });
        const result = dispatchAiOrder(this.scene, unit, newOrder, this.player.playerNumber!);
        if (result.status === "dispatched") assignedCount++;
      });
      this.logDebugInfo(`[Defense] ${assignedCount} defenders assigned to targets`);
      return assignedCount > 0 ? State.SUCCEEDED : State.FAILED;
    }
    this.logDebugInfo("[Defense] No defenders available or no enemies to engage");
    return State.FAILED;
  }

  async AttackEnemyBase(): Promise<State> {
    const now = this.blackboard.getNow();
    if (!this.cooldowns.canRun("attackTrigger", now)) {
      this.logDebugInfo("[Attack] Attack trigger on cooldown");
      return State.FAILED;
    }
    if (!this.HasEnoughMilitaryPower()) {
      this.logDebugInfo("[Attack] Insufficient military power for attack");
      return State.FAILED;
    }
    // Ensure target updated
    await this.targetingManager.update(now);
    const target = this.blackboard.primaryTarget;
    if (!target) {
      this.logDebugInfo("[Attack] No primary target identified");
      return State.FAILED;
    }
    this.logDebugInfo(`[Attack] Coordinated attack on primary target: ${target.name}`);
    let assignedCount = 0;
    this.blackboard.units.forEach((unit) => {
      const aiController = getActorComponent(unit, PawnAiController);
      if (!aiController) return;
      if (aiController.blackboard.getCurrentOrder()) return;
      if (!this.canIssueDirectObjectiveOrder(unit, target)) return;
      const newOrder = new OrderData(OrderType.Attack, { targetGameObject: target });
      const result = dispatchAiOrder(this.scene, unit, newOrder, this.player.playerNumber!);
      if (result.status === "dispatched") assignedCount++;
    });
    this.logDebugInfo(`[Attack] ${assignedCount} units assigned to attack ${target.name}`);
    if (assignedCount === 0) return State.FAILED;
    this.cooldowns.markRun("attackTrigger", now);
    this.blackboard.cooldowns.attackTrigger = now;
    return State.SUCCEEDED;
  }

  /** Prevents the transitional legacy attacker from bypassing Stage-8 route feasibility. */
  protected canIssueDirectObjectiveOrder(unit: GameObject, target: GameObject): boolean {
    const observation = this.observationPipeline.getObservation();
    const graph = observation?.map?.accessGraph;
    const unitId = getActorComponent(unit, IdComponent)?.id;
    const targetId = getActorComponent(target, IdComponent)?.id;
    const source = observation?.actors.find((actor) => actor.actorId === unitId);
    const destination = observation?.actors.find((actor) => actor.actorId === targetId);
    if (!graph || source?.accessNodeId.status !== "known" || destination?.accessNodeId.status !== "known") {
      this.recordDecision("attackEnemyBase", "failed", "path_not_found");
      return false;
    }
    const capabilities = source.capabilities;
    const result = queryAiAccessRouteV1(graph, {
      queryId: `query:legacy-direct:${unitId}:${targetId}`,
      kind: "firing_position",
      fromNodeId: source.accessNodeId.value,
      toNodeId: destination.accessNodeId.value,
      capabilities: {
        moverDomains: capabilities.flatMap((capability) => capability.domains),
        targetDomains: capabilities.flatMap((capability) => capability.targetDomains),
        waterTransportSeats: 0,
        airTransportSeats: 0,
        requiredPassengerSeats: 1,
        requiredClearance: 1
      },
      firingNodeIds: [destination.accessNodeId.value]
    });
    const direct = result.kind === "direct" || result.kind === "air_or_naval_objective";
    if (!direct) this.recordDecision("attackEnemyBase", "failed", "path_not_found");
    return direct;
  }

  // TODO #654: We can use something like this to determine if the player is weak, but it needs to be event-driven and stored in the blackboard or player directly
  // const { currentPlayerActors, enemyActors } = ScenePlayerHelpers.getActorsByPlayer(this.scene, this.player.playerNumber!);
  // let enemyPlayersUnitsCount = 0;
  // // find enemy player with least units
  // enemyActors.forEach((actors) => {
  //   if (actors.length < enemyPlayersUnitsCount  enemyPlayersUnitsCount === 0) {
  //     enemyPlayersUnitsCount = actors.length;
  //   }
  // });
  // const currentPlayerUnitsCount = currentPlayerActors.length;
  // return enemyPlayersUnitsCount < currentPlayerUnitsCount;
  IsEnemyPlayerWeak() {
    const weaker = isEnemyPlayerWeak(this.blackboard.militaryStrength, this.blackboard.enemyMilitaryStrength);
    this.recordDecision(
      "isEnemyPlayerWeak",
      weaker ? "succeeded" : "failed",
      weaker ? "enemy_weaker" : "enemy_not_weaker"
    );
    return weaker;
  }

  ShiftToAggressiveStrategy() {
    if (this.blackboard.currentStrategy === "aggressive") {
      this.logDebugInfo("[Strategy] Already in aggressive strategy");
      return State.FAILED;
    }
    const now = this.blackboard.getNow();
    if (!this.cooldowns.canRun("strategyShift", now)) {
      this.logDebugInfo("[Strategy] Strategy shift on cooldown");
      return State.FAILED; // cooldown gate
    }
    if (this.blackboard.isStrategyLocked(now)) {
      const remainingMs = this.blackboard.strategy.modeLockedUntil - now;
      this.logDebugInfo(`[Strategy] Strategy locked for ${(remainingMs / 1000).toFixed(1)}s more`);
      return State.FAILED; // lock gate fixed
    }
    const ratio =
      this.blackboard.getAttackPowerRatio(now) *
      (this.player.playerController.data.playerDefinition?.campaignAiAggressionScale ?? 1);
    const hysteresis = this.hysteresisAggressive(ratio);
    if (!hysteresis.entered) {
      this.logDebugInfo(
        `[Strategy] Power ratio ${ratio.toFixed(2)} insufficient for aggressive shift (hysteresis not satisfied)`
      );
      return State.FAILED; // require sustained superiority
    }
    this.blackboard.lockStrategy("aggressive", now, AI_CONFIG.strategyLockMs);
    this.cooldowns.markRun("strategyShift", now);
    this.blackboard.currentStrategy = "aggressive"; // legacy field maintained
    this.logDebugInfo(
      `[Strategy] ✓ SHIFTED TO AGGRESSIVE (power ratio: ${ratio.toFixed(2)}, military: ${this.blackboard.militaryStrength.toFixed(0)} vs ${this.blackboard.enemyMilitaryStrength.toFixed(0)})`
    );
    return State.SUCCEEDED;
  }

  ShiftToDefensiveStrategy() {
    if (this.blackboard.currentStrategy === "defensive") {
      this.logDebugInfo("[Strategy] Already in defensive strategy");
      return State.FAILED;
    }
    const now = this.blackboard.getNow();
    if (!this.cooldowns.canRun("strategyShift", now)) {
      this.logDebugInfo("[Strategy] Strategy shift on cooldown");
      return State.FAILED;
    }
    if (this.blackboard.isStrategyLocked(now)) {
      const remainingMs = this.blackboard.strategy.modeLockedUntil - now;
      this.logDebugInfo(`[Strategy] Strategy locked for ${(remainingMs / 1000).toFixed(1)}s more`);
      return State.FAILED;
    }
    this.blackboard.lockStrategy("defensive", now, AI_CONFIG.strategyLockMs);
    this.cooldowns.markRun("strategyShift", now);
    this.blackboard.currentStrategy = "defensive"; // legacy field maintained
    const ratio = this.blackboard.getAttackPowerRatio(now);
    this.logDebugInfo(
      `[Strategy] ✓ SHIFTED TO DEFENSIVE (power ratio: ${ratio.toFixed(2)}, military: ${this.blackboard.militaryStrength.toFixed(0)} vs ${this.blackboard.enemyMilitaryStrength.toFixed(0)})`
    );
    return State.SUCCEEDED;
  }

  ShiftToEconomicStrategy() {
    if (this.blackboard.currentStrategy === "economic") {
      this.logDebugInfo("[Strategy] Already in economic strategy");
      return State.FAILED;
    }
    const now = this.blackboard.getNow();
    if (!this.cooldowns.canRun("strategyShift", now)) {
      this.logDebugInfo("[Strategy] Strategy shift on cooldown");
      return State.FAILED;
    }
    if (this.blackboard.isStrategyLocked(now)) {
      const remainingMs = this.blackboard.strategy.modeLockedUntil - now;
      this.logDebugInfo(`[Strategy] Strategy locked for ${(remainingMs / 1000).toFixed(1)}s more`);
      return State.FAILED;
    }
    this.blackboard.lockStrategy("economic", now, AI_CONFIG.strategyLockMs);
    this.cooldowns.markRun("strategyShift", now);
    this.blackboard.currentStrategy = "economic"; // legacy field maintained
    this.logDebugInfo(
      `[Strategy] ✓ SHIFTED TO ECONOMIC (workers: ${this.blackboard.workers.length}, base size: ${this.blackboard.baseSize})`
    );
    return State.SUCCEEDED;
  }

  // ================= Surrender Logic =================
  ShouldOfferSurrender(): boolean {
    // Don't offer surrender if already offered or rejected
    if (this.blackboard.wantsToSurrender || this.blackboard.surrenderRejected) return false;

    // Check if AI is in a losing position
    const totalUnits = this.blackboard.units.length + this.blackboard.workers.length;
    const totalBuildings = this.blackboard.productionBuildings.length;
    const resources = this.blackboard.getTotalResources();

    // Surrender conditions:
    // 1. Very low unit count (< 3 units)
    // 2. Low building count (< 2 buildings)
    // 3. Enemy has significant military advantage (3x or more, or AI has no military)
    // 4. Very low resources (< 100 total)
    const veryLowUnits = totalUnits < 3;
    const fewBuildings = totalBuildings < 2;
    const enemyAdvantage =
      (this.blackboard.militaryStrength === 0 && this.blackboard.enemyMilitaryStrength > 0) ||
      (this.blackboard.militaryStrength > 0 &&
        this.blackboard.enemyMilitaryStrength > this.blackboard.militaryStrength * 3);
    const lowResources = resources < 100;

    // AI should surrender if it meets multiple losing conditions
    const losingConditionsMet = [veryLowUnits, fewBuildings, enemyAdvantage, lowResources].filter(Boolean).length >= 2;

    return losingConditionsMet;
  }

  OfferSurrender(): State {
    const now = this.blackboard.getNow();
    this.blackboard.wantsToSurrender = true;
    this.blackboard.surrenderOfferedAt = now;
    this.logDebugInfo("AI player offering surrender");
    return State.SUCCEEDED;
  }
}
