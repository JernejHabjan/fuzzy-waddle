import { BehaviorTree } from '../characters/AI/BehaviorTree';
import { Blackboard } from '../characters/AI/blackboard';
import { IComponent } from '../services/component.service';

export interface IAiPawnControllable {
  aiPawnControllerComponent: AiPawnControllerComponent;
}
export class AiPawnControllerComponent implements IComponent {
  constructor(public blackboard: Blackboard, public behaviorTree: BehaviorTree) {}

  init(): void {
    // todo
  }

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
