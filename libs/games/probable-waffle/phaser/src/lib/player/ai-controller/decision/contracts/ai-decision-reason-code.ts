/** Stable reasons used by the controller controller trace and debug overview. */
export type AiDecisionReasonCode =
  | "already_gathering"
  | "command_dispatched"
  | "command_rejected"
  | "enemy_not_weaker"
  | "enemy_weaker"
  | "missing_actor_id"
  | "missing_command_bus"
  | "missing_target_id"
  | "no_active_gatherers"
  | "no_idle_workers"
  | "no_legal_research"
  | "non_host"
  | "path_not_found"
  | "pure_planner_authoritative"
  | "research_started";
