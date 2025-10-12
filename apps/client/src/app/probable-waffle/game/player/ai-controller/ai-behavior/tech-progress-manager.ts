import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { State } from "mistreevous";
import { getActorComponent } from "../../../data/actor-component";
import { ProductionComponent } from "../../../entity/components/production/production-component";

/**
 * TechProgressManager
 * - Drives timing & execution of tech / upgrade tasks.
 * - Uses simple pacing: only one active upgrade, spaced by cooldown & resource threshold.
 */
export class TechProgressManager {
  private readonly techCooldownMs = 12000;
  private readonly minResourcesForTech = 600;

  constructor(
    private readonly blackboard: PlayerAiBlackboard,
    private readonly log: (...args: any[]) => void
  ) {}

  shouldPursueNext(): boolean {
    const now = Date.now();
    if (this.blackboard.activeTechUpgrades > 0) return false;
    if (now - this.blackboard.lastTechUpgradeAt < this.techCooldownMs) return false;
    return this.blackboard.getTotalResources() >= this.minResourcesForTech;
  }

  haveIdleUpgradeBuilding(): boolean {
    if (!this.blackboard.upgradeBuilding) return false;
    const prod = getActorComponent(this.blackboard.upgradeBuilding, ProductionComponent);
    return !!prod && prod.isIdle;
  }

  hasResourcesForNext(): boolean {
    return this.blackboard.getTotalResources() >= this.minResourcesForTech;
  }

  startNext(): State {
    if (!this.blackboard.upgradeBuilding) return State.FAILED;
    const prod = getActorComponent(this.blackboard.upgradeBuilding, ProductionComponent);
    if (!prod || !prod.isIdle) return State.FAILED;

    return State.FAILED; // Placeholder until actual upgrade definitions are available

    // Placeholder "tech upgrade" job (could map to actual upgrade definitions)
    // todo const fakeUpgrade = {
    // todo   actorName: "TechUpgrade_Lv1",
    // todo   costData: { resources: { wood: 200, stone: 150 } }
    // todo } satisfies ProductionQueueItem;
    // todo
    // todo try {
    // todo   prod.startProduction(fakeUpgrade);
    // todo   this.blackboard.activeTechUpgrades += 1;
    // todo   this.blackboard.lastTechUpgradeAt = Date.now();
    // todo   this.log("Started tech upgrade:", fakeUpgrade.actorName);
    // todo   // Simulate completion callback (placeholder - should hook into production completion event)
    // todo   setTimeout(() => {
    // todo     this.blackboard.activeTechUpgrades = Math.max(0, this.blackboard.activeTechUpgrades - 1);
    // todo   }, 4000);
    // todo   return State.SUCCEEDED;
    // todo } catch {
    // todo   return State.FAILED;
    // todo }
  }
}
