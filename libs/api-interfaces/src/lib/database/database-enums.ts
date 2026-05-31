export enum GameKey {
  ProbableWaffle = "probable-waffle",
  FlySquasher = "fly-squasher",
  LittleMuncher = "little-muncher"
}

export enum UserAccountStatus {
  Active = "active",
  Limited = "limited",
  Disabled = "disabled"
}

export enum ChatChannelType {
  GlobalLobby = "global_lobby",
  GameLobby = "game_lobby",
  GameSession = "game_session",
  Direct = "direct",
  System = "system"
}

export enum ChatMembershipRole {
  Owner = "owner",
  Moderator = "moderator",
  Member = "member"
}

export enum ChatMessageStatus {
  Visible = "visible",
  Hidden = "hidden",
  Deleted = "deleted"
}

export enum ChatReportReason {
  Spam = "spam",
  Abuse = "abuse",
  Harassment = "harassment",
  HateSpeech = "hate_speech",
  Cheating = "cheating",
  PersonalInformation = "personal_information",
  Other = "other"
}

export enum ChatReportStatus {
  Open = "open",
  Reviewed = "reviewed",
  Dismissed = "dismissed",
  Actioned = "actioned"
}

export enum GameSessionStatus {
  InProgress = "in_progress",
  Completed = "completed",
  Abandoned = "abandoned"
}

export enum GameParticipantType {
  Human = "human",
  Ai = "ai",
  Spectator = "spectator"
}

export enum GameResultStatus {
  Win = "win",
  Loss = "loss",
  Tie = "tie",
  Quit = "quit"
}

export enum AchievementDifficulty {
  Easy = "easy",
  Medium = "medium",
  Hard = "hard"
}
