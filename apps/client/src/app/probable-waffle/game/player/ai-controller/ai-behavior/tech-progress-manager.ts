import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { State } from "mistreevous";
import { getActorComponent } from "../../../data/actor-component";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { ResearchComponent } from "../../../entity/components/research/research-component";
import { SpellComponent } from "../../../entity/components/combat/components/spell-component";
import { ResearchType } from "../../../entity/components/research/research-type";
import { researchDefinitions } from "../../../entity/components/research/research-definitions";
import { SpellType } from "../../../entity/components/combat/spell-type";

/**
 * TechProgressManager
 * - Drives timing & execution of tech / upgrade tasks.
 * - Uses simple pacing: only one active upgrade, spaced by cooldown & resource threshold.
 * - Now includes spell research for AI players.
 */
export class TechProgressManager {
  private readonly techCooldownMs = 12000;
  private readonly minResourcesForTech = 600;
  private readonly researchCooldownMs = 5000;
  private lastResearchAttemptAt = 0;

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

  // ========== Spell Research Methods ==========

  /**
   * Check if we should attempt spell research
   */
  shouldResearchSpells(): boolean {
    const now = Date.now();
    if (now - this.lastResearchAttemptAt < this.researchCooldownMs) return false;
    // Check if we have spell casters
    return this.hasSpellCasters();
  }

  /**
   * Check if AI has any units with SpellComponent
   */
  private hasSpellCasters(): boolean {
    return this.blackboard.units.some((unit) => {
      const spellComponent = getActorComponent(unit, SpellComponent);
      return spellComponent !== undefined;
    });
  }

  /**
   * Find buildings with ResearchComponent that can research spells
   */
  getResearchBuildings(): Phaser.GameObjects.GameObject[] {
    const allBuildings = [...this.blackboard.trainingBuildings, ...this.blackboard.productionBuildings];

    return allBuildings.filter((building) => {
      const researchComponent = getActorComponent(building, ResearchComponent);
      return researchComponent !== undefined;
    });
  }

  /**
   * Find the next spell research to pursue based on AI's spell casters
   */
  getNextResearchPriority(): ResearchType | null {
    // Collect all spells that AI's units can cast
    const neededSpells = new Set<SpellType>();
    for (const unit of this.blackboard.units) {
      const spellComponent = getActorComponent(unit, SpellComponent);
      if (spellComponent) {
        for (const spellType of spellComponent.availableSpells) {
          neededSpells.add(spellType);
        }
      }
    }

    // Find research that unlocks these spells
    for (const [researchType, researchData] of Object.entries(researchDefinitions)) {
      if (researchData.unlocksSpell && neededSpells.has(researchData.unlocksSpell)) {
        // Check if we can research this at any building
        const researchBuildings = this.getResearchBuildings();
        for (const building of researchBuildings) {
          const researchComponent = getActorComponent(building, ResearchComponent);
          if (researchComponent) {
            const { canStart } = researchComponent.canStartResearch(researchType as ResearchType);
            if (canStart) {
              return researchType as ResearchType;
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Attempt to start spell research
   */
  tryStartSpellResearch(): State {
    this.lastResearchAttemptAt = Date.now();

    const researchType = this.getNextResearchPriority();
    if (!researchType) {
      return State.FAILED;
    }

    // Find a building that can perform this research
    const researchBuildings = this.getResearchBuildings();
    for (const building of researchBuildings) {
      const researchComponent = getActorComponent(building, ResearchComponent);
      if (researchComponent) {
        const { canStart } = researchComponent.canStartResearch(researchType);
        if (canStart) {
          const success = researchComponent.startResearch(researchType);
          if (success) {
            this.log("AI started spell research:", researchType);
            return State.SUCCEEDED;
          }
        }
      }
    }

    return State.FAILED;
  }

  /**
   * Check if any research is currently in progress
   */
  isResearchInProgress(): boolean {
    const researchBuildings = this.getResearchBuildings();
    return researchBuildings.some((building) => {
      const researchComponent = getActorComponent(building, ResearchComponent);
      return researchComponent?.isResearching ?? false;
    });
  }
}
