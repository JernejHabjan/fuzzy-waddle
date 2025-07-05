// Achievement definitions - in a real app, these might come from a config file
import { AchievementDefinition } from "./achievement-definition";
import { AchievementType } from "./achievement-type";

export const PROBABLE_WAFFLE_ACHIEVEMENTS: Record<AchievementType, AchievementDefinition> = {
  // Progression
  [AchievementType.FIRST_STEPS]: {
    id: AchievementType.FIRST_STEPS,
    name: "First Steps",
    description: "Complete the tutorial.",
    image: "achievements/first_steps.png",
    category: "Progression",
    difficulty: "easy"
  },
  [AchievementType.CAMPAIGNER]: {
    id: AchievementType.CAMPAIGNER,
    name: "Campaigner",
    description: "Complete the first campaign mission.",
    image: "achievements/campaigner.png",
    category: "Progression",
    difficulty: "easy"
  },
  [AchievementType.WAR_HERO]: {
    id: AchievementType.WAR_HERO,
    name: "War Hero",
    description: "Complete the entire campaign.",
    image: "achievements/war_hero.png",
    category: "Progression",
    difficulty: "hard"
  },

  // Milestones
  [AchievementType.FIRST_VICTORY]: {
    id: AchievementType.FIRST_VICTORY,
    name: "First Victory",
    description: "Win your first skirmish or multiplayer game.",
    image: "achievements/first_victory.png",
    category: "Milestones",
    difficulty: "easy"
  },
  [AchievementType.THE_ARCHITECT]: {
    id: AchievementType.THE_ARCHITECT,
    name: "The Architect",
    description: "Construct one of every building type in a single match.",
    image: "achievements/the_architect.png",
    category: "Milestones",
    difficulty: "medium"
  },
  [AchievementType.UNIT_COLLECTOR]: {
    id: AchievementType.UNIT_COLLECTOR,
    name: "Unit Collector",
    description: "Train one of every unit type in a single match.",
    image: "achievements/unit_collector.png",
    category: "Milestones",
    difficulty: "medium"
  },
  [AchievementType.HUNDRED_WINS]: {
    id: AchievementType.HUNDRED_WINS,
    name: "Centurion",
    description: "Achieve 100 victories.",
    image: "achievements/hundred_wins.png",
    category: "Milestones",
    difficulty: "hard"
  },

  // Economy
  [AchievementType.RESOURCEFUL]: {
    id: AchievementType.RESOURCEFUL,
    name: "Resourceful",
    description: "Gather 10,000 resources in a single game.",
    image: "achievements/resourceful.png",
    category: "Economy",
    difficulty: "easy"
  },
  [AchievementType.MASTER_ECONOMIST]: {
    id: AchievementType.MASTER_ECONOMIST,
    name: "Master Economist",
    description: "End a match with over 50,000 resources in the bank.",
    image: "achievements/master_economist.png",
    category: "Economy",
    difficulty: "medium"
  },
  [AchievementType.ECONOMIC_POWERHOUSE]: {
    id: AchievementType.ECONOMIC_POWERHOUSE,
    name: "Economic Powerhouse",
    description: "Win a game with double the resource income of all opponents.",
    image: "achievements/economic_powerhouse.png",
    category: "Economy",
    difficulty: "hard"
  },

  // Military
  [AchievementType.ANNIHILATOR]: {
    id: AchievementType.ANNIHILATOR,
    name: "Annihilator",
    description: "Destroy 1,000 enemy units across all games.",
    image: "achievements/annihilator.png",
    category: "Military",
    difficulty: "medium"
  },
  [AchievementType.UNSTOPPABLE_FORCE]: {
    id: AchievementType.UNSTOPPABLE_FORCE,
    name: "Unstoppable Force",
    description: "Build an army that reaches the maximum supply limit.",
    image: "achievements/unstoppable_force.png",
    category: "Military",
    difficulty: "medium"
  },
  [AchievementType.SWIFT_VICTORY]: {
    id: AchievementType.SWIFT_VICTORY,
    name: "Swift Victory",
    description: "Win a game in under 10 minutes.",
    image: "achievements/swift_victory.png",
    category: "Military",
    difficulty: "medium"
  },
  [AchievementType.COMEBACK_KING]: {
    id: AchievementType.COMEBACK_KING,
    name: "Comeback King",
    description: "Win a game after your main command center has been destroyed.",
    image: "achievements/comeback_king.png",
    category: "Military",
    difficulty: "hard"
  },

  // Challenge
  [AchievementType.SCOUTS_HONOR]: {
    id: AchievementType.SCOUTS_HONOR,
    name: "Scout's Honor",
    description: "Reveal the entire map in a single game.",
    image: "achievements/scouts_honor.png",
    category: "Challenge",
    difficulty: "easy"
  },
  [AchievementType.NO_FLY_ZONE]: {
    id: AchievementType.NO_FLY_ZONE,
    name: "No-Fly Zone",
    description: "Destroy 50 enemy air units in a single game.",
    image: "achievements/no_fly_zone.png",
    category: "Challenge",
    difficulty: "medium"
  },
  [AchievementType.DEATH_FROM_ABOVE]: {
    id: AchievementType.DEATH_FROM_ABOVE,
    name: "Death From Above",
    description: "Win a game by only building air units (and necessary tech buildings).",
    image: "achievements/death_from_above.png",
    category: "Challenge",
    difficulty: "hard"
  },
  [AchievementType.TURTLE_POWER]: {
    id: AchievementType.TURTLE_POWER,
    name: "Turtle Power",
    description: "Win a game that lasts longer than one hour.",
    image: "achievements/turtle_power.png",
    category: "Challenge",
    difficulty: "medium"
  },

  // Secret
  [AchievementType.MASTER_TACTICIAN]: {
    id: AchievementType.MASTER_TACTICIAN,
    name: "Master Tactician",
    description: "Win a game without losing a single unit.",
    image: "achievements/master_tactician.png",
    category: "Secret",
    difficulty: "hard",
    secret: true
  },
  [AchievementType.CLICK_HAPPY]: {
    id: AchievementType.CLICK_HAPPY,
    name: "Click Happy",
    description: "Click on a single unit 50 times in a row.",
    image: "achievements/click_happy.png",
    category: "Secret",
    difficulty: "easy",
    secret: true
  }
};
