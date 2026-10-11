/** Native gathering and return branches composed into the shared pawn behavior tree. */
export const PawnResourceBehaviorMdsl = `root [Gather] {
    sequence { /* ALL MUST SUCCEED */
        condition [PlayerOrderIs, "gather"]
        /* ensure that action succeeds - we don't want to seek another action as current action is gather */
        succeed {
            selector { /* executes until first succeeds */

                /* Deliver a full pack before tending the next crop or replacing a depleted source. */
                sequence {
                    condition [GatherCapacityFull]
                    action [AssignDropOffResourcesOrder]
                }

                /* ── FARM FIELD TENDING PATH ────────────────────────────── */
                /* Guards: target must be a tendable field AND crops not ready. */
                /* While growing: walk to spot, animate, wait 1.5s — succeeds  */
                /* so the outer succeed{selector} absorbs the tick and the root */
                /* restarts, looping back here until GrowthReady.               */
                /* When GrowthReady: flip{} fails → branch fails → selector     */
                /* falls through to harvest validation / GatherResource below. */
                sequence {
                    condition [TargetHasTendableComponent]
                    /* Exit this branch when crops are ready → fall through to harvest */
                    flip { condition [GrowthReady] }
                    /* Assign self as tender (idempotent) */
                    action [AssignSelfAsTender]
                    /* Walk to a random spot on the field */
                    action [MoveToRandomSpotOnTarget]
                    /* Play correct animation depending on growth stage */
                    selector {
                        /* Seeding phase (0-33%): Thrust animation */
                        sequence {
                            condition [GrowthPercentBelow, 33]
                            action [PlaySeedingAnimation]
                        }
                        /* Growing phase (33-99%): Dig animation */
                        action [PlayTendingAnimation]
                    }
                    /* Pause at spot briefly; exits early when crops become ready */
                    wait [1500] until [GrowthReady]
                    /* Sequence succeeds → selector stops → succeed{} absorbs →  */
                    /* outer root completes for this tick and restarts next tick. */
                }
                /* ─────────────────────────────────────────────────────── */

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
                        condition [HasCarriedResources]
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

`;
