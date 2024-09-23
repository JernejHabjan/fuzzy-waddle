export const PlayerPawnAiControllerMdsl = `
root {
    selector {
        sequence {
            condition [PlayerOrderExists]
            branch [PlayerOrder]
        }
        branch [AiOrder]
    }
}

root [PlayerOrder] {
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
            branch [MoveToTarget]
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

root [AiOrder] {
    selector {
        sequence {
            condition [Attacked]
            condition [HasAttackComponent]
            action [AssignEnemy, "retaliation"]
            branch [ExecuteAttackOrder]
        }
        sequence {
            condition [AnyEnemyVisible]
            condition [HasAttackComponent]
            action [AssignEnemy, "vision"]
            branch [ExecuteAttackOrder]
        }
        sequence {
            condition [HasHarvestComponent]
            condition [CurrentlyGatheringResources]
            branch [GatherAndReturnResources]
        }
        sequence {
          action [MoveRandomlyInRange, 5]
          wait [2000]
        }
    }
}

root [MoveToTarget] {
    sequence {
        action [MoveToTarget]
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
            condition [InRange]
          }
          branch [MoveToTarget]
      }
      sequence {
          condition [CooldownReady, "attack"]
          action [Attack]
      }
  }
}


root [GatherResource] {
    selector {
        flip {
            condition [TargetDepleted]
        }
        action [Stop]
        action [AcquireNewResourceSource]
        sequence {
            flip {
              condition [InRange]
            }
            branch [MoveToTarget]
        }
        sequence {
            condition [CooldownReady, "gather"]
            wait [200]
        }
        action [GatherResource]
    }
}

root [GatherAndReturnResources] {
    selector {
        branch [GatherResource]
        branch [ReturnResources]
    }
}

root [ReturnResources] {
    sequence {
        action [LeaveConstructionSiteOrCurrentContainer]
        selector {
            flip {
                condition [TargetIsAlive]
            }
            action [Stop]
            sequence {
                condition [InRangeOfResourceDropOff]
                branch [MoveToTarget]
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
                    condition [InRange]
                    branch [MoveToTarget]
                }
            }
            action [ConstructBuilding]
        }
    }
}
`;
