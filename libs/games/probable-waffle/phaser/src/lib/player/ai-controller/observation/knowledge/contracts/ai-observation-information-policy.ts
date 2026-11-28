/**
 * The information policy used by one host-owned AI. Normal skirmish is always
 * player-scoped; campaign policies are explicit so a scripted exception cannot
 * silently become a multiplayer visibility bypass.
 */
export type AiObservationInformationPolicy = "skirmish" | "campaign_revealed" | "campaign_omniscient";
