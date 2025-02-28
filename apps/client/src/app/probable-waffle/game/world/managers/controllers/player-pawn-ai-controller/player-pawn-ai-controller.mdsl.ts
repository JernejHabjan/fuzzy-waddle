/**
 * sequence - runs children until first FAILURE or all SUCCESS
 * selector - finishes when first child returns SUCCESS
 * parallel - runs multiple until all SUCCESS or any FAILURE
 * race - runs multiple until any SUCCESS or all FAILURE
 * all - runs multiple until all finish
 * lotto - selects one child to run
 * repeat - runs N times or until child returns FAILURE
 * retry - runs N times if child returns FAILURE, if child returns SUCCESS, returns SUCCESS
 * flip - returns SUCCESS if child returns FAILURE, returns FAILURE if child returns SUCCESS
 * succeed - returns SUCCESS
 * fail - returns FAILURE
 * action - runs a function
 * condition - checks a condition
 * wait - waits for N seconds
 * branch - runs another tree
 * callbacks - entry, step, exit functions
 * guards - removes node from running state if condition is false - useful with wait
 *   while - if condition is true
 *   until - if condition is false
 * */

export const PlayerPawnAiControllerMdsl = `
root {
    selector {
        fail {
            sequence {
                condition [OrderExistsInQueue]
                action [AssignNextOrderFromQueue]
            }
        }
        branch [ExecuteCurrentOrder]
        branch [AutoAssignNewOrder]
    }
}

root [ExecuteCurrentOrder] {
    selector {
        sequence {
            condition [PlayerOrderIs, "attack"]
            condition [HasAttackComponent]
            condition [TargetExists]
            condition [TargetIsAlive]
            branch [AttackMoveEnemyTarget]
        }
        sequence {
            condition [PlayerOrderIs, "move"]
            action [MoveToTargetOrLocation, "move"]
        }
        sequence {
            condition [PlayerOrderIs, "stop"]
            action [Stop]
        }
        sequence {
            condition [PlayerOrderIs, "gather"]
            condition [HasHarvestComponent]
            condition [TargetHasResources]
            branch [GatherResource]
        }
        sequence {
            condition [PlayerOrderIs, "returnResources"]
            condition [HasHarvestComponent]
            branch [ReturnResources]
        }
        sequence {
            condition [PlayerOrderIs, "build"]
            branch [ConstructBuilding]
        }
        sequence {
            condition [PlayerOrderIs, "repair"]
            branch [ConstructBuilding]
        }
        sequence {
            condition [PlayerOrderIs, "heal"]
            branch [Heal]
        }
    }
}

root [AutoAssignNewOrder] {
    selector {
        sequence {
            condition [Attacked]
            condition [HasAttackComponent]
            flip {
                condition [HasHarvestComponent]
            }
            action [AssignEnemy, "retaliation"]
        }
        sequence {
            condition [AnyEnemyVisible]
            condition [HasAttackComponent]
            flip {
                condition [HasHarvestComponent]
            }
            action [AssignEnemy, "vision"]
        }
        sequence {
          action [AssignMoveRandomlyInRange, 5]
        }
    }
}

root [AttackMoveEnemyTarget] {
  selector {
      sequence {
        flip {
          condition [TargetIsAlive]
        }
        action [Stop]
      }
      sequence {
          flip {
            condition [InRange, "attack"]
          }
          action [MoveToTarget, "attack"]
      }
      sequence {
          condition [CooldownReady, "attack"]
          action [Attack]
      }
  }
}


root [GatherResource] {
    selector {
        sequence {
          flip {
              condition [TargetHasResources]
          }
          action [AcquireNewResourceSource]
        }
        sequence {
            flip {
              condition [InRange, "gather"]
            }
            action [MoveToTarget, "gather"]
        }
        sequence {
            condition [CooldownReady, "gather"]
            action [GatherResource]
        }
    }
}

root [ReturnResources] {
    sequence {
        action [LeaveConstructionSiteOrCurrentContainer]
        selector {
            sequence {
              flip {
                condition [TargetIsAlive]
              }
              action [Stop]
            }
            sequence {
                flip {
                  condition [InRange, "dropOff"]
                }
                action [MoveToTarget, "dropOff"]
            }
            action [DropOffResources]
            action [ContinueGathering]
        }
    }
}

root [ConstructBuilding] {
    sequence {
        action [LeaveConstructionSiteOrCurrentContainer]
        parallel {
            selector {
                flip {
                    condition [TargetIsAlive]
                }
                action [Stop]
                action [LeaveConstructionSiteOrCurrentContainer]
                sequence {
                    condition [InRange, "construct"]
                    action [MoveToTarget, "construct"]
                }
            }
            sequence {
                condition [CooldownReady, "construct"]
                action [ConstructBuilding]
            }
        }
    }
}

root [Heal] {
    sequence {
        action [LeaveConstructionSiteOrCurrentContainer]
        parallel {
            selector {
                flip {
                    condition [TargetIsAlive]
                }
                action [Stop]
                action [LeaveConstructionSiteOrCurrentContainer]
                sequence {
                    condition [InRange, "heal"]
                    action [MoveToTarget, "heal"]
                }
            }
            sequence {
                condition [CooldownReady, "heal"]
                action [Heal]
            }
        }
    }
}
`;
