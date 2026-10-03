import type { TutorialShowcaseSelection } from "@fuzzy-waddle/trump-defense-gameplay";

/** One skippable briefing card; the showcase model is rendered by {@link ThreeScene}. */
export interface LevelTutorialSlide {
  /** Short headline visible above the model showcase. */
  title: string;
  /** Gameplay rule or action the player needs before deploying. */
  description: string;
  /** Level-authored model to spin in the showcase, or null for a scene explanation. */
  showcase: TutorialShowcaseSelection;
  /** Optional upgraded model preview; this demonstration never spends campaign money. */
  upgradedShowcase?: TutorialShowcaseSelection;
}

const groundSlides: LevelTutorialSlide[] = [
  {
    title: "GROUND FORCES",
    description: "Ground troops march along the marked road toward your wall. Cannons hit them hard.",
    showcase: "MexicanBanjo"
  },
  {
    title: "CANNON",
    description: "Cannons track and blast ground troops. Sniper towers unlock on the next battlefield.",
    showcase: "Cannon"
  },
  {
    title: "PICK A BUILD SITE",
    description: "Click a marked tile to choose where to build. The road is off limits; keep the cannon beside it.",
    showcase: "BuildTile"
  },
  {
    title: "MORE FIREPOWER",
    description: "Select your cannon on the battlefield, then hit Upgrade. Cash buys more damage and longer range.",
    showcase: "Cannon",
    upgradedShowcase: "Cannon2"
  },
  {
    title: "HEARTS ARE LIVES",
    description: "Every heart is a life. Let too many invaders reach the wall and this campaign is toast.",
    showcase: "Heart"
  },
  {
    title: "RAISE THE WALL",
    description: "Build the wall with your cash. Raise it to the target height to hold this front.",
    showcase: "Wall"
  }
];

const airSlides: LevelTutorialSlide[] = [
  {
    title: "AIR RAID",
    description: "Ballooners fly over the road. Ground cannons cannot reach them, so bring the right defense.",
    showcase: "MexicanBalooner"
  },
  {
    title: "SNIPER TOWER",
    description: "Sniper towers are built to hit flying units. Place one where it can cover the route.",
    showcase: "SniperTower"
  },
  {
    title: "GROUND REINFORCEMENTS",
    description: "Builders now join the ground attack. Keep cannons covering the road while snipers watch the skies.",
    showcase: "Builder"
  },
  {
    title: "NIGHT WATCH",
    description: "This front is dark. Spotlights reveal the spawn areas and help you watch the incoming attack.",
    showcase: null
  }
];

const finalSlides: LevelTutorialSlide[] = [
  {
    title: "OPEN BATTLEFIELD",
    description:
      "There is no single marked build site here. Choose a defense and it will land on a random available tile.",
    showcase: ["Cannon", "SniperTower"]
  },
  {
    title: "MAFIA ON THE MARCH",
    description: "Mafia troops join the ground assault. Give them a proper cannon welcome along the road.",
    showcase: "MexicanMafia"
  },
  {
    title: "MORE TROUBLE IN THE SKY",
    description: "Another balloon unit joins the air raid. Sniper towers can hit it; cannons cannot.",
    showcase: "MexicanBaloon"
  }
];

/** Returns the mechanics briefing for a campaign level without mixing copy into game state. */
export function getLevelTutorial(level: number): readonly LevelTutorialSlide[] {
  if (level === 1) return groundSlides;
  if (level === 2) return airSlides;
  return finalSlides;
}
