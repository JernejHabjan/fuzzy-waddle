import type { Database } from "../../database/database.types";

export const GameKey = {
  ProbableWaffle: "probable-waffle",
  FlySquasher: "fly-squasher",
  LittleMuncher: "little-muncher"
} as const;

export type GameKey = (typeof GameKey)[keyof typeof GameKey];

export const GameKeys = Object.values(GameKey) as readonly GameKey[];

export const AppUserRole = {
  User: "user",
  Moderator: "moderator",
  Admin: "admin"
} as const satisfies Record<string, Database["public"]["Enums"]["app_user_role"]>;

export type AppUserRole = Database["public"]["Enums"]["app_user_role"];

export const UserAccountStatus = {
  Active: "active",
  Limited: "limited",
  Disabled: "disabled"
} as const satisfies Record<string, Database["public"]["Enums"]["user_account_status"]>;

export type UserAccountStatus = Database["public"]["Enums"]["user_account_status"];

export const ChatChannelType = {
  GlobalLobby: "global_lobby",
  GameLobby: "game_lobby",
  GameSession: "game_session",
  Direct: "direct",
  System: "system"
} as const satisfies Record<string, Database["public"]["Enums"]["chat_channel_type"]>;

export type ChatChannelType = Database["public"]["Enums"]["chat_channel_type"];

export const ChatMessageStatus = {
  Visible: "visible",
  Hidden: "hidden",
  Deleted: "deleted"
} as const satisfies Record<string, Database["public"]["Enums"]["chat_message_status"]>;

export type ChatMessageStatus = Database["public"]["Enums"]["chat_message_status"];

export const ChatReportReason = {
  Spam: "spam",
  Abuse: "abuse",
  Harassment: "harassment",
  HateSpeech: "hate_speech",
  Cheating: "cheating",
  PersonalInformation: "personal_information",
  Other: "other"
} as const satisfies Record<string, Database["public"]["Enums"]["chat_report_reason"]>;

export type ChatReportReason = Database["public"]["Enums"]["chat_report_reason"];

export const ChatReportStatus = {
  Open: "open",
  Reviewed: "reviewed",
  Dismissed: "dismissed",
  Actioned: "actioned"
} as const satisfies Record<string, Database["public"]["Enums"]["chat_report_status"]>;

export type ChatReportStatus = Database["public"]["Enums"]["chat_report_status"];

export const GameSessionStatus = {
  InProgress: "in_progress",
  Completed: "completed",
  Abandoned: "abandoned"
} as const satisfies Record<string, Database["public"]["Enums"]["game_session_status"]>;

export type GameSessionStatus = Database["public"]["Enums"]["game_session_status"];

export const GameParticipantType = {
  Human: "human",
  Ai: "ai",
  Spectator: "spectator"
} as const satisfies Record<string, Database["public"]["Enums"]["game_participant_type"]>;

export type GameParticipantType = Database["public"]["Enums"]["game_participant_type"];

export const GameResultStatus = {
  Win: "win",
  Loss: "loss",
  Tie: "tie",
  Quit: "quit"
} as const satisfies Record<string, Database["public"]["Enums"]["game_result_status"]>;

export type GameResultStatus = Database["public"]["Enums"]["game_result_status"];
