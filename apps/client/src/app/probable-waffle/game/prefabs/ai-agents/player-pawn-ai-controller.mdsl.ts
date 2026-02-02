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
        branch [Attack]
        branch [Move]
        branch [Stop]
        branch [Gather]
        branch [ReturnResources]
        branch [Build]
        branch [Repair]
        branch [Heal]
    }
}

root [AutoAssignNewOrder] {
    selector {

        /* Retaliation */
        sequence {
            condition [Attacked]
            condition [HasAttackComponent]
            flip {
                condition [HasHarvestComponent]
            }
            action [AssignEnemy, "retaliation"]
        }

        /* Attacking visible enemies */
        sequence {
            condition [AnyEnemyVisible]
            condition [HasAttackComponent]
            flip {
                condition [HasHarvestComponent]
            }
            action [AssignEnemy, "vision"]
        }

        /* Moving randomly */
        /* sequence { */
        /*     action [AssignMoveRandomlyInRange, 1] */
        /*     sequence { */
        /*         wait [2000, 5000] */
        /*     } */
        /* } */
    }
}

root [Attack] {
    sequence { /* ALL MUST SUCCEED */
        condition [PlayerOrderIs, "attack"]
        /* ensure that action succeeds - we don't want to seek another action as current action is attack */
        succeed {
            selector { /* executes until first succeeds */
                /* if no target or location, stop */
                sequence {
                    flip {
                        condition [TargetOrLocationExists]
                    }
                    action [Stop, "Attack - No Target Or Location"]
                }

                /* if no attack component, stop */
                sequence {
                    flip {
                        condition [HasAttackComponent]
                    }
                    action [Stop, "Attack - No Attack Component"]
                }

                /* if target exists but is not alive, stop */
                sequence {
                    condition [TargetExists]
                    flip {
                        condition [TargetIsAlive]
                    }
                    action [Stop, "Attack - Target Not Alive"]
                }

                /* try to acquire visible enemy for current attack (attack-move) */
                sequence {
                    flip {
                        condition [TargetExists]
                    }
                    condition [AnyEnemyVisible]
                    action [AssignVisibleEnemyToCurrentOrder]
                }

                /* exit current container */
                fail { /* marks itself as fail, so it doesn't exist selector branch */
                    action [LeaveConstructionSiteOrCurrentContainer]
                }

                /* if not in range, move to target or location */
                sequence {
                    flip {
                      action [InRange, "attack"]
                    }
                    action [MoveToTargetOrLocation, "attack"]
                }

                sequence {
                    /* if cooldown not ready, wait */
                    flip {
                        condition [CooldownReady, "attack"]
                    }
                    sequence {
                        /* cooldown may not be ready - wait until it is ms */
                        /* action [Log, "Waiting in attack"] */
                        wait [5] until [CooldownReady, "attack"]
                        /* action [Log, "Done waiting in attack"] */
                    }
                }

                /* validate again if I'm alive, if target is alive or target is reachable, etc */
                /* consolidate liveness validations: stop if any fail */
                sequence {
                    flip {
                        parallel {
                            condition [SelfIsAlive]
                            condition [TargetIsAlive]
                        }
                    }
                    action [Stop, "Attack - Validation Failed"]
                }

                /* cooldown ready, attack */
                action [Attack]
            }
        }
    }
}

root [Move] {
    sequence { /* ALL MUST SUCCEED */
        condition [PlayerOrderIs, "move"]
        /* ensure that action succeeds - we don't want to seek another action as current action is move */
        succeed {
            selector { /* executes until first succeeds */
                /* if no target, stop */
                sequence {
                    flip {
                        condition [TargetOrLocationExists]
                    }
                    action [Stop, "Move - No Target"]
                }

                /* exit current container */
                fail { /* marks itself as fail, so it doesn't exist selector branch */
                    action [LeaveConstructionSiteOrCurrentContainer]
                }

                /* move */
                fail {
                    action [MoveToTargetOrLocation, "move"]
                }

                /* if reached target, stop */
                sequence {
                    /* action [Log, "Reached target"] */
                    action [InRange, "move"]
                    action [Stop, "Move - Reached Target"]
                }
            }
        }
    }
}

root [Stop] {
    sequence { /* ALL MUST SUCCEED */
        condition [PlayerOrderIs, "stop"]
        /* ensure that action succeeds - we don't want to seek another action as current action is stop */
        succeed {
            action [Stop, "Stop - Order Complete"]
        }
    }
}

root [Gather] {
    sequence { /* ALL MUST SUCCEED */
        condition [PlayerOrderIs, "gather"]
        /* ensure that action succeeds - we don't want to seek another action as current action is gather */
        succeed {
            selector { /* executes until first succeeds */
                fail { /* marks itself as fail, so it doesn't exist selector branch */
                    sequence {
                        /* if target does not have resources, acquire new resource source */
                        flip {
                            condition [TargetHasResources]
                        }
                        action [AcquireNewResourceSource]
                    }
                }

                /* if no resources exist on the map, stop */
                sequence {
                    flip {
                        condition [TargetExists]
                    }
                    action [Stop, "Gather - No Resources Exist"]
                }

                /* if no harvest component, stop */
                sequence {
                    flip {
                        condition [HasHarvestComponent]
                    }
                    action [Stop, "Gather - No Harvest Component"]
                }

                /* if gathering capacity is full, drop off resources */
                sequence {
                    condition [GatherCapacityFull]
                    action [AssignDropOffResourcesOrder]
                }

                /* exit current container */
                fail { /* marks itself as fail, so it doesn't exist selector branch */
                    action [LeaveConstructionSiteOrCurrentContainer]
                }

                /* if target not in range, move to target */
                sequence {
                    flip {
                      action [InRange, "gather"]
                    }
                    action [MoveToTarget, "gather"]
                }

                sequence {
                    /* if cooldown not ready, wait */
                    flip {
                        condition [CooldownReady, "gather"]
                    }
                    sequence {
                        /* cooldown may not be ready - wait until it is ms */
                        /* action [Log, "Waiting in gather"] */
                        wait [5] until [CooldownReady, "gather"]
                        /* action [Log, "Done waiting in gather"] */
                    }
                }

                /* validate again if I'm alive and target is alive */
                /* consolidate liveness + resource validations: stop if any fail */
                sequence {
                    flip {
                        parallel {
                            condition [SelfIsAlive]
                            condition [TargetHasResources]
                        }
                    }
                    action [Stop, "Gather - Validation Failed"]
                }

                /* cooldown ready, gather */
                action [GatherResource]
            }
        }
    }

}

root [ReturnResources] {
    sequence { /* ALL MUST SUCCEED */
        condition [PlayerOrderIs, "returnResources"]
        /* ensure that action succeeds - we don't want to seek another action as current action is returnResources */
        succeed {
            selector { /* executes until first succeeds */
                fail { /* marks itself as fail, so it doesn't exist selector branch */
                    sequence {
                        /* if target is not alive, try acquiring new resource drain */
                        flip {
                            condition [TargetIsAlive]
                        }
                        action [AcquireNewResourceDrain]
                    }
                }

                /* if no resource drains exist on the map, stop */
                sequence {
                    flip {
                        condition [TargetExists]
                    }
                    action [Stop, "ReturnResources - No Resource Drains Exist"]
                }

                /* if no harvest component, stop */
                sequence {
                    flip {
                        condition [HasHarvestComponent]
                    }
                    action [Stop, "ReturnResources - No Harvest Component"]
                }

                /* if gathering capacity is empty, gather */
                sequence {
                    flip {
                        condition [GatherCapacityFull]
                    }
                    action [AssignGatherResourcesOrder]
                }

                /* exit current container */
                fail { /* marks itself as fail, so it doesn't exist selector branch */
                    action [LeaveConstructionSiteOrCurrentContainer]
                }

                /* if target not in range, move to target */
                sequence {
                    flip {
                      action [InRange, "dropOff"]
                    }
                    action [MoveToTarget, "dropOff"]
                }

                sequence {
                    /* consolidate liveness validations: stop if any fail */
                    flip {
                        parallel {
                            condition [SelfIsAlive]
                            condition [TargetIsAlive]
                        }
                    }
                    action [Stop, "ReturnResources - Validation Failed"]
                }

                /* deposit resources */
                action [DropOffResources]
            }
        }
    }
}

root [Build] {
    sequence { /* ALL MUST SUCCEED */
        condition [PlayerOrderIs, "build"]
        /* ensure that action succeeds - we don't want to seek another action as current action is build */
        succeed {
            selector { /* executes until first succeeds */
                /* if no target, stop */
                sequence {
                    flip {
                        condition [TargetExists]
                    }
                    action [Stop, "Build - No Target"]
                }

                /* if no builderComponent, stop */
                sequence {
                    flip {
                        condition [HasBuilderComponent]
                    }
                    action [Stop, "Build - No Builder Component"]
                }

                /* if builder cannot be assigned, stop */
                sequence {
                    flip {
                        condition [CanAssignBuilder]
                    }
                    action [Stop, "Build - Cannot Assign Builder"]
                }

                /* exit current container */
                fail { /* marks itself as fail, so it doesn't exist selector branch */
                    action [LeaveConstructionSiteOrCurrentContainer]
                }

                /* if target not in range, move to target */
                sequence {
                    flip {
                      action [InRange, "construct"]
                    }
                    action [MoveToTarget, "construct"]
                }

                /* if target is unreachable (MoveToTarget failed), stop and try next construction site */
                sequence {
                    flip {
                      action [InRange, "construct"]
                    }
                    /* we're not in range and couldn't move there - target unreachable */
                    action [Stop, "Build - Target Unreachable"]
                    action [AssignNextBuildOrder]
                }

                sequence {
                    /* if cooldown not ready, wait */
                    flip {
                        condition [CooldownReady, "construct"]
                    }
                    sequence {
                        /* cooldown may not be ready - wait until it is ms */
                        /* action [Log, "Waiting in construct"] */
                        wait [5] until [CooldownReady, "construct"]
                        /* action [Log, "Done waiting in construct"] */
                    }
                }

                /* validate again if I'm alive and target exists */
                /* consolidate validations: stop if any fail */
                sequence {
                    flip {
                        parallel {
                            condition [SelfIsAlive]
                            condition [TargetExists]
                            condition [CanAssignBuilder]
                        }
                    }
                    action [Stop, "Build - Validation Failed"]
                }

                succeed {
                    sequence {
                      /* cooldown ready, construct */
                      action [ConstructBuilding]

                      action [AssignNextBuildOrder]
                    }
                }
            }
        }
    }
}

root [Repair] {
    sequence { /* ALL MUST SUCCEED */
        condition [PlayerOrderIs, "repair"]
        /* ensure that action succeeds - we don't want to seek another action as current action is repair */
        succeed {
            selector { /* executes until first succeeds */
                /* if no target, stop */
                sequence {
                    flip {
                        condition [TargetExists]
                    }
                    action [Stop, "Repair - No Target"]
                }

                /* if no builderComponent, stop */
                sequence {
                    flip {
                        condition [HasBuilderComponent]
                    }
                    action [Stop, "Repair - No Builder Component"]
                }

                /* if target is not fully built, stop */
                sequence {
                    flip {
                        condition [ConstructionSiteFinished]
                    }
                    action [Stop, "Repair - Construction Not Finished"]
                }

                /* if target health is 100%, stop */
                sequence {
                    condition [TargetHealthFull]
                    action [Stop, "Repair - Target Health Full"]
                }

                /* if repairer cannot be assigned, stop */
                sequence {
                    flip {
                        condition [CanAssignRepairer]
                    }
                    action [Stop, "Repair - Cannot Assign Repairer"]
                }

                /* exit current container */
                fail { /* marks itself as fail, so it doesn't exist selector branch */
                    action [LeaveConstructionSiteOrCurrentContainer]
                }

                /* if target not in range, move to target */
                sequence {
                    flip {
                      action [InRange, "repair"]
                    }
                    action [MoveToTarget, "repair"]
                }

                sequence {
                    /* if cooldown not ready, wait */
                    flip {
                        condition [CooldownReady, "repair"]
                    }
                    sequence {
                        /* cooldown may not be ready - wait until it is ms */
                        /* action [Log, "Waiting in repair"] */
                        wait [5] until [CooldownReady, "repair"]
                        /* action [Log, "Done waiting in repair"] */
                    }
                }

                /* validate again if I'm alive and target is alive */
                /* consolidate validations: stop if any fail */
                sequence {
                    flip {
                        parallel {
                            condition [SelfIsAlive]
                            condition [TargetIsAlive]
                            condition [CanAssignRepairer]
                        }
                    }
                    action [Stop, "Repair - Validation Failed"]
                }

                /* cooldown ready, repair */
                action [RepairBuilding]
            }
        }
    }
}

root [Heal] {
    sequence { /* ALL MUST SUCCEED */
        condition [PlayerOrderIs, "heal"]
        /* ensure that action succeeds - we don't want to seek another action as current action is heal */
        succeed {
            selector { /* executes until first succeeds */
                /* if no target, stop */
                sequence {
                    flip {
                        condition [TargetExists]
                    }
                    action [Stop, "Heal - No Target"]
                }

                /* if no healerComponent, stop */
                sequence {
                    flip {
                        condition [HasHealerComponent]
                    }
                    action [Stop, "Heal - No Healer Component"]
                }

                /* if target health is 100%, stop */
                sequence {
                    condition [TargetHealthFull]
                    action [Stop, "Heal - Target Health Full"]
                }

                /* if healer cannot be assigned, stop */
                sequence {
                    flip {
                        condition [CanHeal]
                    }
                    action [Stop, "Heal - Cannot Heal"]
                }

                /* exit current container */
                fail { /* marks itself as fail, so it doesn't exist selector branch */
                    action [LeaveConstructionSiteOrCurrentContainer]
                }

                /* if target not in range, move to target */
                sequence {
                    flip {
                      action [InRange, "heal"]
                    }
                    action [MoveToTarget, "heal"]
                }

                sequence {
                    /* if cooldown not ready, wait */
                    flip {
                        condition [CooldownReady, "heal"]
                    }
                    sequence {
                        /* cooldown may not be ready - wait until it is ms */
                        /* action [Log, "Waiting in heal"] */
                        wait [5] until [CooldownReady, "heal"]
                        /* action [Log, "Done waiting in heal"] */
                    }
                }

                /* validate again if I'm alive and target is alive */
                /* consolidate validations: stop if any fail (including full health) */
                sequence {
                    flip {
                        parallel {
                            condition [SelfIsAlive]
                            condition [TargetIsAlive]
                            condition [CanHeal]
                            /* stop when TargetHealthFull is true */
                            flip {
                                condition [TargetHealthFull]
                            }
                        }
                    }
                    action [Stop, "Heal - Validation Failed"]
                }

                /* cooldown ready, heal */
                action [Heal]
            }
        }
    }
}
`;
