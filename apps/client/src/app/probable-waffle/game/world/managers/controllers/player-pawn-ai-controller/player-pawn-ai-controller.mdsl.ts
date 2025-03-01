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
        /* branch [AutoAssignNewOrder] */
    }
}

root [ExecuteCurrentOrder] {
    selector {
        branch [Attack]
        branch [Move]
        branch [Stop]
        branch [Gather]
        branch [ReturnResources]
        /*
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
        }*/
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

root [Attack] {
    sequence { /* ALL MUST SUCCEED */
        condition [PlayerOrderIs, "attack"]
        /* ensure that action succeeds - we don't want to seek another action as current action is attack */
        succeed {
            selector { /* executes until first succeeds */
                /* if no target, stop */
                sequence {
                    flip {
                        condition [TargetExists]
                    }
                    action [Stop]
                }

                /* if no attack component, stop */
                sequence {
                    flip {
                        condition [HasAttackComponent]
                    }
                    action [Stop]
                }

                /* if target is not alive, stop */
                sequence {
                    flip {
                        condition [TargetIsAlive]
                    }
                    action [Stop]
                }

                /* exit current container */
                fail { /* marks itself as fail, so it doesn't exist selector branch */
                    action [LeaveConstructionSiteOrCurrentContainer]
                }

                /* if target not in range, move to target */
                sequence {
                    flip {
                      action [InRange, "attack"]
                    }
                    action [MoveToTarget, "attack"]
                }

                sequence {
                    /* if cooldown not ready, wait */
                    flip {
                        condition [CooldownReady, "attack"]
                    }
                    sequence {
                        /* cooldown may not be ready - wait until it is ms */
                        /* action [Log, "Waiting in attack"] */
                        wait [100] until [CooldownReady, "attack"]
                        /* action [Log, "Done waiting in attack"] */
                    }
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
                    action [Stop]
                }

                /* exit current container */
                fail { /* marks itself as fail, so it doesn't exist selector branch */
                    action [LeaveConstructionSiteOrCurrentContainer]
                }

                /* move */
                action [MoveToTargetOrLocation, "move"]

                /* if reached target, stop */
                sequence {
                    action [Log, "Reached target"]
                    action [InRange, "move"]
                    action [Stop]
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
            action [Stop]
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
                    action [Stop]
                }

                /* if no harvest component, stop */
                sequence {
                    flip {
                        condition [HasHarvestComponent]
                    }
                    action [Stop]
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
                        wait [100] until [CooldownReady, "gather"]
                        /* action [Log, "Done waiting in gather"] */
                    }
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
                    action [Stop]
                }

                /* if no harvest component, stop */
                sequence {
                    flip {
                        condition [HasHarvestComponent]
                    }
                    action [Stop]
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

                /* deposit resources */
                action [DropOffResources]
            }
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
                    action [InRange, "construct"]
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
                    action [InRange, "heal"]
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
