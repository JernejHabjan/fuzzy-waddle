import { AchievementType } from "./achievement-type";

export interface AchievementDefinition {
  id: AchievementType;
  name: string;
  description: string;
  image: string;
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
  secret?: boolean;
}
