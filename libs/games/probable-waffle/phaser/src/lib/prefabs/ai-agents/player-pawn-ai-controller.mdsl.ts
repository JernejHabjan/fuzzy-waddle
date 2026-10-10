import { PawnResourceBehaviorMdsl } from "./pawn-resource-behavior.mdsl";
import { PawnConstructionBehaviorMdsl } from "./pawn-construction-behavior.mdsl";

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
        /* If stunned, do nothing - just wait */
        sequence {
            condition [IsStunned]
            action [Succeed]
        }
        /* Normal AI logic when not stunned */
        sequence {
            flip { condition [IsStunned] }
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
        branch [EnterContainerOrder]
    }
}

root [AutoAssignNewOrder] {
    selector {

        /* Autocast spells when ready */
        sequence {
            condition [HasSpellComponent]
            condition [HasAutocastSpellReady]
            action [CastAutocastSpell]
        }

        /* Load pending boarders when docked at shore */
        sequence {
            condition [IsWaterUnit]
            condition [HasContainerComponent]
            condition [HasPendingBoarders]
            selector {
                action [LoadPendingBoarders]
                sequence {
                    action [MoveToShoreForBoarding]
                    action [LoadPendingBoarders]
                }
            }
        }

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
            condition [AnyAttackableEnemyVisible]
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

root [EnterContainerOrder] {
    sequence {
        condition [PlayerOrderIs, "enterContainer"]
        succeed {
            selector {
                /* Already inside a container — nothing to do */
                sequence {
                    condition [IsAlreadyInContainer]
                    action [Stop, "EnterContainer:AlreadyLoaded"]
                }
                /* Land container: walk adjacent, then board if close enough */
                sequence {
                    flip { condition [IsWaterContainerTarget] }
                    action [MoveAdjacentToContainer]
                    condition [CanBoardContainerNow]
                    action [BoardContainer]
                    action [Stop, "EnterContainer:Boarded"]
                }
                /* Water container (boat): walk to shore and register boarding request */
                sequence {
                    condition [IsWaterContainerTarget]
                    action [MoveToNearestShoreForContainer]
                    action [Stop, "EnterContainer:MovedToShore"]
                }
                action [Stop, "EnterContainer:Failed"]
            }
        }
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
                    condition [AnyAttackableEnemyVisible]
                    action [AssignAttackableEnemyToCurrentOrder]
                }

                /* if target exists but cannot be attacked, stop */
                sequence {
                    condition [TargetExists]
                    flip {
                        condition [CanAttackCurrentTarget]
                    }
                    action [Stop, "Attack - Target Not Attackable"]
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

${PawnResourceBehaviorMdsl}${PawnConstructionBehaviorMdsl}root [Heal] {
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
