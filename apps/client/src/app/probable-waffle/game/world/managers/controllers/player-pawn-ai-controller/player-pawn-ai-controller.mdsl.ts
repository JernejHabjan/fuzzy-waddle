export const PlayerPawnAiControllerMdsl = `
root {
    selector {
        sequence {
            condition [OrderExistsInQueue]
            action [AssignNextOrderFromQueue]
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
            branch [ExecuteAttackOrder]
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
            condition [PlayerOrderIs, "beginConstruction"]
            branch [ConstructBuilding]
        }
        sequence {
            condition [PlayerOrderIs, "continueConstruction"]
            branch [ConstructBuilding]
        }
    }
}

root [AutoAssignNewOrder] {
    selector {
        sequence {
            condition [Attacked]
            condition [HasAttackComponent]
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

root [ExecuteAttackOrder] {
    succeed {
        sequence {
            action [LeaveConstructionSiteOrCurrentContainer]
            selector {
                sequence {
                    flip {
                        condition [PlayerOrderIs, "attack"]
                    }
                    condition [HealthAboveThresholdPercentage, 20]
                    branch [AttackMoveEnemyTarget]
                }
            }
            branch [AttackMoveEnemyTarget]
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
        action [AssignResourceDropOff]
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
            action [ConstructBuilding]
        }
    }
}
`;
