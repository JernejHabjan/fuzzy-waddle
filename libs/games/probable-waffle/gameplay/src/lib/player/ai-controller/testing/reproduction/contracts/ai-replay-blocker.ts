export type AiReplayBlocker =
  | "missing_observation_history"
  | "missing_prior_state"
  | "missing_outcome_history"
  | "incompatible_source"
  | "incompatible_config"
  | "incompatible_content"
  | "broken_digest";
