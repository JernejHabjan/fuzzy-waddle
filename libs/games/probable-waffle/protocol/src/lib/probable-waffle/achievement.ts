export interface AchievementDto {
  id: string; // Unique identifier for the achievement
  name: string; // Display name
  description: string; // Achievement description
  image: string; // Image/sprite reference
  unlocked: boolean; // Whether the user has unlocked this achievement
  unlockedDate?: Date; // When the achievement was unlocked (if it was)
  metadata?: any; // Optional metadata (e.g., progress)
  category?: string; // Optional category for grouping achievements
  difficulty?: "easy" | "medium" | "hard"; // Difficulty level
  secret?: boolean; // Whether this is a secret achievement
}
