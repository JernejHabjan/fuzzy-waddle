import { BehaviorTree } from '../characters/AI/BehaviorTree';
import { Blackboard } from '../characters/AI/blackboard';

export interface IAiPawnControllable {
  aiPawnController: AIPawnController;
}
export class AIPawnController {
  constructor(public blackboard: Blackboard, public behaviorTree: BehaviorTree) {}

  /**
   * look for a feasible target in its acquisition radius // circle overlap actors
   */
  FindTargetInAcquisitionRadius() {
    // todo
  }
  AddOrder() {
    // todo
  }
  IsIdle() {
    // todo
  }
  IssueAttackOrder() {
    // todo
  }
  IssueBeginConstructionOrder() {
    // todo
  }
  IssueContinueConstructionOrder() {
    // todo
  }
  IssueGatherOrder() {
    // todo
  }
  IssueContinueGatherOrder() {
    // todo
  }
  IssueReturnResourcesOrder() {
    // todo
  }
  IssueStopOrder() {
    // todo
  }
  ObtainNextOrder() {
    // todo
  }
}
