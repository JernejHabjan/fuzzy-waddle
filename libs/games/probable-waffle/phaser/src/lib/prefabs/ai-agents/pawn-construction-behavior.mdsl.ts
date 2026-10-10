/** Native build and repair branches composed into the shared pawn behavior tree. */
export const PawnConstructionBehaviorMdsl = `root [Build] {
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

                      /* if the just-finished building is a field (tendable), start tending it */
                      action [AutoAssignTendOrderIfTendable]

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

`;
