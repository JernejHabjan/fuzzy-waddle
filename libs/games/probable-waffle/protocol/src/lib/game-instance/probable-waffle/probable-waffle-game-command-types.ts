export const ProbableWaffleGameCommandTypes = {
  Move: "MOVE",
  ActorAction: "ACTOR_ACTION",
  Stop: "STOP",
  Production: "PRODUCTION",
  CancelProduction: "CANCEL_PRODUCTION",
  Research: "RESEARCH",
  CancelResearch: "CANCEL_RESEARCH",
  Construct: "CONSTRUCT",
  CastSpell: "CAST_SPELL",
  Unload: "UNLOAD",
  SetRallyPoint: "SET_RALLY_POINT",
  Concede: "CONCEDE"
} as const;
