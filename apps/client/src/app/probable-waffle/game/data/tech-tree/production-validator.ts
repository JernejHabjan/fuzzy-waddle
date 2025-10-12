// Centralized production & queue validation using tech tree, supply & resource state.
import { ObjectNames, ProbableWafflePlayer, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PlayerAiBlackboard } from "../../player/ai-controller/player-ai-blackboard";
import { TechTreeService } from "./tech-tree.service";
import { getCostForObjectName } from "../../entity/components/production/cost-utils";
import { getSceneService, getSceneSystem } from "../../world/services/scene-component-helpers";
import { AiPlayerHandler } from "../../player/ai-controller/ai-player-handler";

export interface ProductionValidationResult {
  canQueue: boolean;
  reason?: string;
  techBlocked?: boolean;
  supplyBlocked?: boolean;
  prereqs: ObjectNames[];
  cost?: Partial<Record<ResourceType, number>>;
}

export class ProductionValidator {
  static debugEnabled = false; // lightweight debug flag
  static setDebugEnabled(flag: boolean) {
    this.debugEnabled = flag;
  }

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: ProbableWafflePlayer,
    private readonly blackboard: PlayerAiBlackboard
  ) {}

  validate(actorName: ObjectNames): ProductionValidationResult {
    const result: ProductionValidationResult = { canQueue: true, prereqs: [] };
    const techSvc = getSceneService(this.scene, TechTreeService);
    const faction = this.player.factionType;
    // Tech checks
    if (techSvc && faction != null) {
      if (!techSvc.isUnlocked(faction, actorName)) {
        const prereqs = techSvc.getPrerequisites(faction, actorName);
        if (prereqs.length > 0) {
          result.canQueue = false;
          result.techBlocked = true;
          result.prereqs = prereqs;
          result.reason = "tech_locked";
        }
      }
    }
    // Supply check (simple): if projected queued would exceed capacity
    const supply = this.blackboard.production.supply;
    if (supply.max > 0 && supply.used + supply.pendingFromQueued >= supply.max) {
      result.canQueue = false;
      result.supplyBlocked = true;
      result.reason = result.reason || "supply_blocked";
    }
    // Resource cost check (only if tech & supply OK)
    const cost = getCostForObjectName(actorName);
    result.cost = cost;
    if (result.canQueue && cost) {
      if (!this.blackboard.hasAtLeastResources(cost)) {
        result.canQueue = false;
        result.reason = "not_enough_resources";
      }
    }
    if (ProductionValidator.debugEnabled && !result.canQueue) {
      // eslint-disable-next-line no-console
      console.debug("[ProductionValidator] block", { actorName, reason: result.reason, prereqs: result.prereqs });
    }
    return result;
  }

  /** Insert prerequisite tasks into blackboard production prereqQueue (order: earliest first). */
  schedulePrerequisites(prereqs: ObjectNames[], finalTarget: ObjectNames) {
    const now = performance.now();
    // Insert in reverse so that earliest prerequisite appears first in queue processing
    [...prereqs].reverse().forEach((p) => {
      this.blackboard.production.prereqQueue.push({
        id: `${p}-${now}-${Math.random().toString(36).slice(2)}`,
        type: "construct", // default semantic; execution layer decides produce vs construct
        objectName: p,
        insertedAt: now
      });
    });
    // Optionally also push final target marker (optional): keep lean for now.
  }

  static validateForScene(
    scene: Phaser.Scene,
    playerNumber: number,
    actorName: ObjectNames
  ): ProductionValidationResult | null {
    try {
      // Retrieve AI controller via system -> AiPlayerHandler
      // We avoid direct import here to keep coupling low; dynamic require style access.
      const handler = getSceneSystem(scene, AiPlayerHandler);
      if (!handler) return null;
      const controller = handler.getAiPlayerController(playerNumber);
      if (!controller) return null;
      const validator = new ProductionValidator(scene, controller.player, controller.blackboard);
      const validation = validator.validate(actorName);
      if (ProductionValidator.debugEnabled && validation && !validation.canQueue) {
        // eslint-disable-next-line no-console
        console.debug("[ProductionValidator] UI block", { actorName, validation });
      }
      return validation;
    } catch {
      return null;
    }
  }

  static schedulePrereqsForScene(
    scene: Phaser.Scene,
    playerNumber: number,
    target: ObjectNames,
    prereqs: ObjectNames[]
  ) {
    try {
      const handler = getSceneSystem(scene, AiPlayerHandler);
      if (!handler) return;
      const controller = handler.getAiPlayerController(playerNumber);
      if (!controller) return;
      controller.playerAiControllerAgent?.productionValidator?.schedulePrerequisites?.(prereqs, target);
    } catch {
      /* silent */
    }
  }
}
