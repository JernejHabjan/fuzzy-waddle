/**
 * sequence - (needs all succeeded in sequence) updates in sequence - moves to succeeded if all children have succeeded, moves to failed if any have failed
 * selector - (any succeed in sequence) updates in sequence - moves to failed if all have failed, moves to success if any have succeeded
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
 * wait - waits for N ms
 * branch - runs another tree
 * callbacks - entry, step, exit functions
 * guards - removes node from running state if condition is false - useful with wait
 *   while - runs until condition is true
 *   until - runs until condition is false
 * */
export const PlayerAiControllerMdsl = `
root {
    selector {
        branch [AnalyzeMap]
        branch [PlanBase]
        branch [ExecuteBasePlan]
        branch [MaintainForces]
        branch [RepairBase]
        branch [AdjustStrategyBasedOnGameState]
        branch [DefendBase]
        branch [AttackEnemy]
        branch [ExpandBase]
        branch [ManageEconomy]
        branch [ManageLogistics]
        branch [AdvanceTech]
        branch [ScoutEnemy]
        branch [CombatTactics]
    }
}

root [AnalyzeMap] {
    /* Run only when map analysis cache is stale; always fail to allow other selector children to proceed.*/
    fail {
        sequence {
            condition [ShouldReanalyzeMap]
            action [AnalyzeGameMap]
        }
    }
}

root [PlanBase] {
    /* Periodic base (what to build) planning. Fails so selector continues.*/
    fail {
        sequence {
            condition [ShouldReplanBase]
            action [ReplanBase]
        }
    }
}

root [ExecuteBasePlan] {
    /* Turn high-level needs into concrete reservations -> attempt placement. Always fail so selector continues.*/
    fail {
        sequence {
            condition [HasPlannedBuildingNeed]
            action [EnsureReservationForNextNeed]
            condition [HasResourcesForReservedBuilding]
            action [AttemptPlacePlannedBuilding]
        }
    }
}

root [MaintainForces] {
    /* Handles continuous unit production (throttled & resource aware). Fails to allow other branches.*/
    fail {
        sequence {
            condition [ShouldProduceMilitaryUnit]
            condition [HasIdleProductionBuilding]
            condition [HasResourcesForQueuedUnit]
            action [QueueMilitaryUnitProduction]
        }
    }
}

root [RepairBase] {
    /* Assigns repair workers to damaged friendly structures (non-blocking).*/
    fail {
        sequence {
            condition [HasDamagedStructures]
            action [AssignRepairWorkers]
        }
    }
}

root [AdjustStrategyBasedOnGameState] {
    selector {
        sequence {
            condition [IsEnemyPlayerWeak]
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
        action [AssignDefenders]
    }
}

root [AttackEnemy] {
    sequence {
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
    fail {
        sequence {
            branch [GatherResources]
            branch [TrainWorkers]
            branch [OptimizeResourceGathering]
        }
    }
}

root [ManageLogistics] {
    /* Balances resource gathering distribution and resolves bottlenecks (non-blocking).*/
    fail {
        selector {
            sequence {
                condition [ShouldRebalanceHarvesters]
                action [RebalanceHarvesterAllocation]
            }
            sequence {
                condition [StockpileImbalanceDetected]
                action [RedirectWorkersToScarceResource]
            }
        }
    }
}

root [AdvanceTech] {
    /* Drives tech / upgrade progression pacing (non-blocking).*/
    fail {
        sequence {
            condition [ShouldPursueNextTech]
            condition [HaveIdleUpgradeBuilding]
            condition [HasResourcesForNextTech]
            action [StartNextTechUpgrade]
        }
    }
}

root [GatherResources] {
    succeed {
        sequence {
            condition [NeedMoreResources]
            branch [AssignWorkersToGather]
        }
    }
}

root [AssignWorkersToGather] {
    action [AssignWorkersToResource]
}

root [TrainWorkers] {
    succeed {
        sequence {
            condition [NeedMoreWorkers]
            condition [HasIdleTrainingBuilding]
            condition [HasEnoughResourcesForWorker]
            action [TrainWorker]
        }
    }
}

root [OptimizeResourceGathering] {
    succeed {
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
}

root [ChooseStructureToBuild] {
    selector {
        sequence {
            condition [NeedMoreHousing]
            action [AssignHousingBuilding]
        }
        sequence {
            condition [NeedMoreProduction]
            action [AssignProductionBuilding]
        }
        sequence {
            condition [NeedMoreDefense]
            action [AssignDefenseBuilding]
        }
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
    sequence {
        action [GatherEnemyData]
        action [DecideNextMoveBasedOnAnalysis]
    }
}
`;
