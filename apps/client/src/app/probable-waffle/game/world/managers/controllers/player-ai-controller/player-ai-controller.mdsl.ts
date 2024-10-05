export const PlayerAiControllerMdsl = `
root {
    selector {
        branch [AdjustStrategyBasedOnGameState]
        branch [DefendBase]
        branch [AttackEnemy]
        branch [ExpandBase]
        branch [ManageEconomy]
        branch [ScoutEnemy]
    }
}

root [AdjustStrategyBasedOnGameState] {
    selector {
        sequence {
            condition [IsPlayerWeak]
            action [ShiftToAggressiveStrategy]
        }
        sequence {
            condition [IsBaseUnderHeavyAttack]
            action [ShiftToDefensiveStrategy]
        }
        sequence {
            condition [HasSurplusResources]
            action [ShiftToEconomicStrategy]
        }
    }
}

root [DefendBase] {
    sequence {
        condition [IsBaseUnderAttack]
        action [AssignDefendersToEnemies]
        branch [AttackEnemiesAtBase]
    }
}

root [AttackEnemiesAtBase] {
    sequence {
        condition [IsEnemyVisible]
        condition [HasEnoughMilitaryPower]
        action [AttackEnemyBase]
    }
}

root [AttackEnemy] {
    sequence {
        condition [IsEnemyVisible]
        condition [HasEnoughMilitaryPower]
        action [AttackEnemyBase]
    }
}

root [ExpandBase] {
    sequence {
        condition [IsBaseExpansionNeeded]
        condition [HasSufficientResources]
        branch [ChooseStructureToBuild]
        branch [BuildStructure]
    }
}

root [ManageEconomy] {
    selector {
        branch [GatherResources]
        branch [TrainWorkers]
        branch [OptimizeResourceGathering]
    }
}

root [GatherResources] {
    sequence {
        condition [NeedMoreResources]
        branch [AssignWorkersToGather]
    }
}

root [AssignWorkersToGather] {
    sequence {
        action [AssignWorkersToResource]
        action [GatherResource]
    }
}

root [TrainWorkers] {
    sequence {
        condition [HasIdleTrainingBuilding]
        condition [HasEnoughResourcesForWorker]
        action [TrainWorker]
    }
}

root [OptimizeResourceGathering] {
    selector {
        sequence {
            condition [ResourceShortage]
            action [ReassignWorkersToResource]
        }
        sequence {
            condition [SufficientResourcesForUpgrade]
            action [StartUpgrade]
        }
        action [ContinueNormalGathering]
    }
}

root [ChooseStructureToBuild] {
    selector {
        condition [NeedMoreHousing]
        condition [NeedMoreProduction]
        condition [NeedMoreDefense]
    }
}

root [BuildStructure] {
    sequence {
        action [AssignWorkerToBuild]
        action [StartBuildingStructure]
    }
}

root [ScoutEnemy] {
    sequence {
        condition [NeedToScout]
        action [AssignScoutUnits]
        selector {
            sequence {
                condition [EnemySpotted]
                action [AnalyzeEnemyBase]
            }
            action [ContinueScouting]
        }
    }
}

root [CombatTactics] {
    selector {
        sequence {
            condition [IsInCombat]
            branch [ExecuteCombatMicro]
        }
    }
}

root [ExecuteCombatMicro] {
    parallel {
        sequence {
            condition [LowHealthUnit]
            action [RetreatUnit]
        }
        sequence {
            condition [EnemyInRange]
            action [FocusFire]
        }
        sequence {
            condition [EnemyFlankOpen]
            action [FlankEnemy]
        }
    }
}

root [AnalyzeEnemyBase] {
    selector {
        action [GatherEnemyData]
        action [DecideNextMoveBasedOnAnalysis]
    }
}
`;
