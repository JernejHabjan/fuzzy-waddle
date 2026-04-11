import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { State } from "mistreevous";
import { getActorComponent } from "../../../data/actor-component";
import { ResearchComponent } from "../../../entity/components/research/research-component";
import { SpellComponent } from "../../../entity/components/combat/components/spell-component";
import { researchDefinitions } from "../../../entity/components/research/research-definitions";
import { SpellType } from "../../../entity/components/combat/spell-type";
import { ResearchType } from "@fuzzy-waddle/api-interfaces";

/**
 * TechProgressManager
 * - Drives timing & execution of research tasks (ResearchComponent-based).
 * - Uses simple pacing: only one active research at a time, spaced by cooldown & resource threshold.
 * - Currently prioritizes spell research based on AI's unit composition.
 * - Extensible to support other research types in the future.
 */
export class TechProgressManager {
  private readonly researchCooldownMs = 5000;
  private readonly minResourcesForResearch = 600;
  private lastResearchAttemptAt = 0;

  constructor(
    private readonly blackboard: PlayerAiBlackboard,
    private readonly log: (...args: any[]) => void
  ) {}

  // ========== Research Methods ==========

  /**
   * Check if we should attempt research (currently prioritizes spell research)
   */
  shouldPursueResearch(): boolean {
    const now = this.blackboard.getNow();
    if (now - this.lastResearchAttemptAt < this.researchCooldownMs) return false;
    if (this.blackboard.getTotalResources() < this.minResourcesForResearch) return false;
    // Check if we have spell casters (can be extended for other research types)
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
   * Attempt to start research (currently prioritizes spell research based on unit composition)
   */
  tryStartResearch(): State {
    this.lastResearchAttemptAt = this.blackboard.getNow();

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
            // this.log("AI started research:", researchType);
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
