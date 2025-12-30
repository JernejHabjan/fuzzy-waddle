/**
 * sequence - updates in sequence, succeeds if all children succeed, fails if any child fails
 * selector - updates in sequence, succeeds if any child succeeds, fails if all children fail
 * parallel - updates all children concurrently, succeeds if all succeed, fails if any fails
 * race - updates all children concurrently, succeeds if any succeeds, fails if all fail
 * all - updates all children concurrently until all finish
 * lotto - selects one child to run
 * repeat - runs N times or until child returns FAILURE
 * retry - runs N times if child returns FAILURE, returns SUCCESS if child returns SUCCESS
 * flip - inverts child result: SUCCESS becomes FAILURE, FAILURE becomes SUCCESS
 * succeed - returns SUCCESS
 * fail - returns FAILURE
 * action - runs a function
 * condition - checks a condition, returns SUCCESS or FAILURE based on result
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
        branch [CheckSurrender]
        branch [AnalyzeMap]
        branch [PlanBase]
        branch [ExecuteBasePlan]
        branch [MaintainForces]
        branch [RepairBase]
        branch [AdjustStrategyBasedOnGameState]
        branch [DefendBase]
        branch [AttackEnemy]
        branch [ManageEconomy]
        branch [ManageLogistics]
        branch [AdvanceTech]
        branch [ScoutEnemy]
        branch [CombatTactics]
    }
}

root [CheckSurrender] {
    /* Check if AI should offer surrender when in a losing position. Fails to allow other selector children to proceed.*/
    fail {
        sequence {
            condition [ShouldOfferSurrender]
            action [OfferSurrender]
        }
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
            condition [HasSupplyCapacity]
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
    /* Adjusts overall AI strategy based on game state (non-blocking).*/
    fail {
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
}

root [DefendBase] {
    /* Assigns defenders if base is under attack (non-blocking).*/
    fail {
        sequence {
            condition [IsBaseUnderAttack]
            action [AssignDefenders]
        }
    }
}

root [AttackEnemy] {
    /* Initiates attacks on enemy bases when conditions are met (non-blocking).*/
    fail {
        sequence {
            condition [HasEnoughMilitaryPower]
            action [AttackEnemyBase]
        }
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
            /* condition [NeedMoreResources] */
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
            condition [HasSupplyCapacity]
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

root [ScoutEnemy] {
    fail {
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
}

root [CombatTactics] {
    fail {
        selector {
            sequence {
                condition [IsInCombat]
                branch [ExecuteCombatMicro]
            }
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
