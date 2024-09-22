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
            condition [TargetIsAlive]
            branch [ExecuteAttackOrder]
        }
        sequence {
            condition [PlayerOrderIs, "move"]
            condition [TargetExists]
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
            condition [PlayerOrderIs, "return"]
            condition [HasHarvestComponent]
            branch [ReturnResources]
        }
    }
}

root [AiOrder] {
    sequence {
        action [LeaveConstructionSiteOrCurrentContainer]
        selector {
            sequence {
                condition [AnyEnemyVisible]
                condition [HasAttackComponent]
                action [AttackEnemy]
            }
            sequence {
                condition [HasHarvestComponent]
                condition [CurrentlyGatheringResources]
                branch [GatherAndReturnResources]
            }
            action [MoveRandomlyInRange, 5]
        }
    }
}

root [MoveToTarget] {
    selector {
        sequence {
            condition [PlayerOrderExists]
            action [MoveToTarget]
        }
        parallel {
            condition [TargetIsAlive]
            condition [CanMoveToTarget]
            action [MoveToTarget]
            sequence {
                condition [Attacked]
                condition [HasAttackComponent]
                action [Stop]
                action [AssignTarget, "attacker"]
                action [Attack]
            }
        }
    }
}

root [ExecuteAttackOrder] {
    sequence {
        action [LeaveConstructionSiteOrCurrentContainer]
        selector {
            sequence {
                flip {
                    condition [PlayerOrderIs, "attack"]
                }
                condition [HealthAboveThreshold, 20]
            }
        }
        selector {
            flip {
                condition [TargetIsAlive]
            }
            action [Stop]
            sequence {
                condition [InRange]
                branch [MoveToTarget]
            }
            action [Attack]
        }
    }
}

root [GatherResource] {
    selector {
        flip {
            condition [CanGatherResource]
        }
        action [Stop]
        sequence {
            action [LeaveConstructionSiteOrCurrentContainer]
            selector {
                flip {
                    condition [TargetDepleted]
                }
                action [Stop]
                action [AcquireNewResourceSource]
                sequence {
                    condition [InRange]
                    branch [MoveToTarget]
                }
                sequence {
                    condition [CooldownReady]
                    wait [200]
                }
                action [GatherResource]
            }
        }
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
