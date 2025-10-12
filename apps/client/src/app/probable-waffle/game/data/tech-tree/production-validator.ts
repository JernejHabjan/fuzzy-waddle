// Centralized production & queue validation using tech tree, supply & resource state.
import { FactionType, ObjectNames, ProbableWafflePlayer, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PlayerAiBlackboard } from "../../player/ai-controller/player-ai-blackboard";
import { TechTreeService } from "./tech-tree.service";
import { getCostForObjectName } from "../../entity/components/production/cost-utils";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { getPlayer } from "../scene-data";

export enum ProductionInvalidReason {
  TechLocked = "tech_locked",
  SupplyBlocked = "supply_blocked",
  NotEnoughResources = "not_enough_resources"
}

export interface ProductionValidationResult {
  canQueue: boolean;
  reason?: ProductionInvalidReason;
  techBlocked?: boolean;
  supplyBlocked?: boolean;
  prereqs: ObjectNames[];
  cost?: Partial<Record<ResourceType, number>>;
}

export class ProductionValidator {
  private static readonly debugEnabled = false;

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
    ProductionValidator.validateTechPrerequisites(techSvc, faction, actorName, result);

    // Supply check (simple): if projected queued would exceed capacity
    const supply = this.blackboard.production.supply;
    if (supply.max > 0 && supply.used + supply.pendingFromQueued >= supply.max) {
      result.canQueue = false;
      result.supplyBlocked = true;
      result.reason = result.reason || ProductionInvalidReason.SupplyBlocked;
    }
    // Resource cost check (only if tech & supply OK)
    const cost = getCostForObjectName(actorName);
    result.cost = cost;
    if (result.canQueue && cost) {
      if (!this.blackboard.hasAtLeastResources(cost)) {
        result.canQueue = false;
        result.reason = ProductionInvalidReason.NotEnoughResources;
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

  private static validateTechPrerequisites(
    techSvc: TechTreeService | undefined,
    faction: FactionType | undefined,
    actorName: ObjectNames,
    result: ProductionValidationResult
  ) {
    if (techSvc && faction != null) {
      if (!techSvc.isUnlocked(faction, actorName)) {
        const prereqs = techSvc.getPrerequisites(faction, actorName);
        if (prereqs.length > 0) {
          result.canQueue = false;
          result.techBlocked = true;
          result.prereqs = prereqs;
          result.reason = ProductionInvalidReason.TechLocked;
        }
      }
    }
  }

  static validateObject(scene: Phaser.Scene, playerNumber: number, actorName: ObjectNames): ProductionValidationResult {
    const result: ProductionValidationResult = { canQueue: true, prereqs: [] };
    const player = getPlayer(scene, playerNumber);
    if (!player) {
      result.canQueue = false;
      return result;
    }

    // Tech checks
    const techSvc = getSceneService(scene, TechTreeService);
    const faction = player.factionType;
    ProductionValidator.validateTechPrerequisites(techSvc, faction, actorName, result);

    // Resource cost check
    const cost = getCostForObjectName(actorName);
    result.cost = cost;
    if (result.canQueue && cost) {
      if (!player.canPayAllResources(cost)) {
        result.canQueue = false;
        result.reason = ProductionInvalidReason.NotEnoughResources;
      }
    }

    return result;
  }
}
