import {
  type CampaignCatalog,
  type CampaignChapterDefinition,
  type CampaignMissionDefinition,
  ProbableWaffleMapEnum
} from "@fuzzy-waddle/api-interfaces";

const campaignArtworkRoot = "assets/probable-waffle/campaign";

function createArtwork(key: string, alt: string, focalPosition: string) {
  return {
    desktopSrc: `${campaignArtworkRoot}/chapters/${key}.webp`,
    alt,
    focalPosition
  };
}

function mission(
  chapterId: string,
  order: number,
  id: string,
  title: string,
  faction: CampaignMissionDefinition["faction"],
  availability: CampaignMissionDefinition["availability"],
  prerequisites: string[],
  environment: string,
  briefing: string,
  objectives: string[],
  mapId: ProbableWaffleMapEnum = ProbableWaffleMapEnum.EmberEnclave
): CampaignMissionDefinition {
  return {
    id,
    chapterId,
    order,
    title,
    faction,
    contentType: "mission",
    availability,
    prerequisites,
    environment,
    briefing,
    objectives,
    mapId
  };
}

const chapters: CampaignChapterDefinition[] = [
  {
    id: "prologue",
    order: 0,
    title: "The Dream",
    subtitle: "Prologue",
    summary: "Ancient visions draw Tivara and Skaduwee toward the same uncertain future.",
    layout: "single",
    artwork: createArtwork("prologue-the-dream", "A volcanic vision at the beginning of the campaign", "50% 45%"),
    missions: [
      mission(
        "prologue",
        0,
        "dreams",
        "Dreams",
        "switching",
        "playable",
        [],
        "Volcanic highlands",
        "A shared dream becomes a call to arms. Learn why both homelands are bound to the ancient crystal.",
        ["Explore the volcanic highlands", "Discover the source of the visions", "Protect the ancient crystal"]
      )
    ]
  },
  {
    id: "two-homelands",
    order: 1,
    title: "Two Homelands",
    subtitle: "Chapter I",
    summary: "Tivara and Skaduwee follow separate paths, until neither can ignore the other any longer.",
    layout: "parallel",
    artwork: createArtwork("two-homelands", "Desert and snowbound homelands divided by an ancient road", "50% 50%"),
    missions: [
      mission(
        "two-homelands",
        0,
        "cyclops-and-sheep",
        "Cyclops & Sheep",
        "tivara",
        "playable",
        ["dreams"],
        "Tivara plains",
        "Tivara faces a growing threat close to home.",
        ["Secure the settlement", "Defeat the invading force"],
        ProbableWaffleMapEnum.RiverCrossing
      ),
      mission(
        "two-homelands",
        1,
        "snow-wendigo-and-fire",
        "Snow Wendigo & Fire",
        "skaduwee",
        "playable",
        ["cyclops-and-sheep"],
        "Skaduwee tundra",
        "A winter hunt reveals an ember that should not exist in the snow.",
        ["Track the wendigo", "Recover the ember"],
        ProbableWaffleMapEnum.RiverCrossing
      ),
      mission(
        "two-homelands",
        2,
        "slingshooters-and-wolves",
        "Slingshooters & Wolves",
        "tivara",
        "playable",
        ["snow-wendigo-and-fire"],
        "Tivara woodland",
        "The road forward is guarded by more than wolves.",
        ["Train the slingshooters", "Clear the pass"]
      ),
      mission(
        "two-homelands",
        3,
        "owl-and-skaduwee-crystal",
        "Owl & Skaduwee Crystal",
        "skaduwee",
        "playable",
        ["slingshooters-and-wolves"],
        "Skaduwee ice fields",
        "A watchful guide leads Skaduwee to a crystal beneath the ice.",
        ["Find the crystal", "Hold the excavation"]
      ),
      mission(
        "two-homelands",
        4,
        "sand-dunes-and-tivara-crystal",
        "Sand Dunes & Tivara Crystal",
        "tivara",
        "playable",
        ["owl-and-skaduwee-crystal"],
        "Tivara dunes",
        "Tivara's crystal is buried under shifting sand and old resentment.",
        ["Cross the dunes", "Claim the crystal"]
      ),
      mission(
        "two-homelands",
        5,
        "we-had-enough",
        "We Had Enough",
        "switching",
        "playable",
        ["sand-dunes-and-tivara-crystal"],
        "Borderlands",
        "The two journeys collide at last.",
        ["Meet both forces", "Survive the confrontation"]
      )
    ]
  },
  {
    id: "crystal-war",
    order: 2,
    title: "The Crystal War",
    subtitle: "Chapter II",
    summary: "The promise of a shared future turns into open conflict over the crystals.",
    layout: "collision",
    artwork: createArtwork("crystal-war", "A frozen fortress facing a fleet across crystal waters", "45% 50%"),
    missions: [
      mission(
        "crystal-war",
        0,
        "sailing-towards-the-new-future",
        "Sailing Towards the New Future",
        "both",
        "planned",
        ["we-had-enough"],
        "Crystal coast",
        "Both factions sail toward a future neither fully trusts.",
        ["Reach the coast", "Defend the fleet"]
      ),
      mission(
        "crystal-war",
        1,
        "the-first-and-last-dinner",
        "The First and Last Dinner",
        "both",
        "planned",
        ["sailing-towards-the-new-future"],
        "Harbor city",
        "A tense meal is the last chance for peace.",
        ["Attend the summit", "Escape the ambush"]
      ),
      mission(
        "crystal-war",
        2,
        "the-siege",
        "The Siege",
        "both",
        "planned",
        ["the-first-and-last-dinner"],
        "Crystal citadel",
        "The war reaches the gates.",
        ["Break the siege", "Protect the civilians"]
      ),
      mission(
        "crystal-war",
        3,
        "time-rush",
        "Time Rush",
        "both",
        "planned",
        ["the-siege"],
        "Fractured valley",
        "The crystal's power destabilizes time itself.",
        ["Reach the rift", "Stabilize the crystals"]
      ),
      mission(
        "crystal-war",
        4,
        "joining-crystal",
        "Joining Crystal",
        "both",
        "planned",
        ["time-rush"],
        "Ancient convergence",
        "Only a joined crystal can end the escalation.",
        ["Unite the fragments", "Defend the ritual"]
      )
    ]
  },
  {
    id: "united-against-volcano",
    order: 3,
    title: "United Against the Volcano",
    subtitle: "Chapter III",
    summary: "The old rivals fight together as the volcano wakes beneath them.",
    layout: "united",
    artwork: createArtwork(
      "united-against-volcano",
      "Tivara and Skaduwee armies advancing together toward a volcano",
      "50% 42%"
    ),
    missions: [
      mission(
        "united-against-volcano",
        0,
        "mobster-or-friend",
        "Mobster or Friend?",
        "both",
        "planned",
        ["joining-crystal"],
        "Volcanic foothills",
        "An unlikely ally offers help at a cost.",
        ["Meet the contact", "Choose whom to trust"]
      ),
      mission(
        "united-against-volcano",
        1,
        "the-volcano-is-getting-angry",
        "The Volcano Is Getting Angry",
        "both",
        "planned",
        ["mobster-or-friend"],
        "Fire mountain",
        "The mountain begins to answer the crystal's call.",
        ["Evacuate the valley", "Contain the eruption"]
      ),
      mission(
        "united-against-volcano",
        2,
        "cult-wars",
        "Cult Wars",
        "both",
        "planned",
        ["the-volcano-is-getting-angry"],
        "Ashen ruins",
        "A cult turns chaos into an army.",
        ["Expose the cult", "Defeat its leaders"]
      ),
      mission(
        "united-against-volcano",
        3,
        "the-volcano",
        "The Volcano",
        "both",
        "planned",
        ["cult-wars"],
        "Volcanic heart",
        "The alliance reaches the source of the disaster.",
        ["Enter the volcano", "Secure the ancient chamber"]
      )
    ]
  },
  {
    id: "the-betrayal",
    order: 4,
    title: "The Betrayal",
    subtitle: "Chapter IV",
    summary: "The final path returns to the volcano, where the alliance is tested one last time.",
    layout: "finale",
    artwork: createArtwork("the-betrayal", "A corrupted volcanic battlefield under violet storm clouds", "50% 48%"),
    missions: [
      mission(
        "the-betrayal",
        0,
        "the-betrayal",
        "The Betrayal",
        "both",
        "planned",
        ["the-volcano"],
        "Volcanic heart",
        "A trusted companion reveals a hidden purpose.",
        ["Escape the betrayal", "Protect the crystal"]
      ),
      mission(
        "the-betrayal",
        1,
        "undead-and-cursed-lands",
        "Undead & Cursed Lands",
        "both",
        "planned",
        ["the-betrayal"],
        "Cursed lands",
        "The dead rise where the crystal has scarred the earth.",
        ["Cross the cursed lands", "Cleanse the corruption"]
      ),
      mission(
        "the-betrayal",
        2,
        "end-game",
        "End Game",
        "both",
        "planned",
        ["undead-and-cursed-lands"],
        "Volcanic throne",
        "Everything leads back to the ancient power below.",
        ["Confront the enemy", "Control the eruption"]
      ),
      mission(
        "the-betrayal",
        3,
        "resolution",
        "Resolution",
        "both",
        "planned",
        ["end-game"],
        "New dawn",
        "The future is finally chosen.",
        ["Resolve the conflict", "Shape the future"]
      )
    ]
  }
];

export const AOTA_CAMPAIGN_CATALOG: CampaignCatalog = {
  version: 1,
  chapters
};
