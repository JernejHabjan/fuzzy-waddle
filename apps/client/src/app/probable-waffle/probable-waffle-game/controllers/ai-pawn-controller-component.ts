import { BehaviorTree } from '../characters/AI/BehaviorTree';
import { Blackboard } from '../characters/AI/blackboard';
import { IComponent } from '../services/component.service';
import { Actor } from '../actor';

export interface IAiPawnControllable {
  aiPawnControllerComponent: AiPawnControllerComponent;
}

export class AiPawnControllerComponent implements IComponent {
  constructor(public blackboard: Blackboard, public behaviorTree: BehaviorTree) {
  }

  init(): void {
    // todo
  }

  /**
   * look for a feasible target in its acquisition radius // circle overlap actors
   */
  findTargetInAcquisitionRadius() {
    // todo
  }

  addOrder() {
    // todo
  }

  isIdle() {
    // todo
  }

  issueAttackOrder() {
    // todo
  }

  issueBeginConstructionOrder() {
    // todo
  }

  issueContinueConstructionOrder(actor: Actor) {
    // todo
  }

  issueGatherOrder() {
    // todo
  }

  issueContinueGatherOrder() {
    // todo
  }

  issueReturnResourcesOrder() {
    // todo
  }

  issueStopOrder() {
    // todo
  }

  obtainNextOrder() {
    // todo
  }
}
