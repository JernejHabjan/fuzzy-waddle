import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import type { PrefabDefinition } from "../../definitions/prefab-definition";

const cropDefinition = {
  components: {
    objectDescriptor: {
      color: null
    },
    selectable: {},
    resourceSource: {
      resourceType: ResourceType.Food,
      maximumResources: 50,
      gatheringFactor: 1,
      maxGatherers: 2,
      cooldown: 2000
    }
  }
} satisfies PrefabDefinition;

export const cropsBeanDefinition = {
  ...cropDefinition,
  components: {
    ...cropDefinition.components,
    info: {
      name: "Beans",
      description: "A patch of ripe beans ready for harvest",
      tooltipDescription: ["Provides food resource", "Send workers to harvest"],
      smallImage: { key: "crops", frame: "crops/beans/8.png", origin: { x: 0.5, y: 0.5 } }
    }
  }
} satisfies PrefabDefinition;

export const cropsCabbageDefinition = {
  ...cropDefinition,
  components: {
    ...cropDefinition.components,
    info: {
      name: "Cabbage",
      description: "A head of cabbage ready for harvest",
      tooltipDescription: ["Provides food resource", "Send workers to harvest"],
      smallImage: { key: "crops", frame: "crops/cabbage/4.png", origin: { x: 0.5, y: 0.5 } }
    }
  }
} satisfies PrefabDefinition;

export const cropsCucumbersDefinition = {
  ...cropDefinition,
  components: {
    ...cropDefinition.components,
    info: {
      name: "Cucumbers",
      description: "Cucumbers ready for harvest",
      tooltipDescription: ["Provides food resource", "Send workers to harvest"],
      smallImage: { key: "crops", frame: "crops/cucumbers/4.png", origin: { x: 0.5, y: 0.5 } }
    }
  }
} satisfies PrefabDefinition;

export const cropsGrapesDefinition = {
  ...cropDefinition,
  components: {
    ...cropDefinition.components,
    info: {
      name: "Grapes",
      description: "Ripe grapes ready for harvest",
      tooltipDescription: ["Provides food resource", "Send workers to harvest"],
      smallImage: { key: "crops", frame: "crops/grapes/0.png", origin: { x: 0.5, y: 0.5 } }
    }
  }
} satisfies PrefabDefinition;

export const cropsLettuceDefinition = {
  ...cropDefinition,
  components: {
    ...cropDefinition.components,
    info: {
      name: "Lettuce",
      description: "Fresh lettuce ready for harvest",
      tooltipDescription: ["Provides food resource", "Send workers to harvest"],
      smallImage: { key: "crops", frame: "crops/salad/8.png", origin: { x: 0.5, y: 0.5 } }
    }
  }
} satisfies PrefabDefinition;

export const cropsPeppersDefinition = {
  ...cropDefinition,
  components: {
    ...cropDefinition.components,
    info: {
      name: "Peppers",
      description: "Ripe peppers ready for harvest",
      tooltipDescription: ["Provides food resource", "Send workers to harvest"],
      smallImage: { key: "crops", frame: "crops/peppers/0.png", origin: { x: 0.5, y: 0.5 } }
    }
  }
} satisfies PrefabDefinition;

export const cropsPineappleDefinition = {
  ...cropDefinition,
  components: {
    ...cropDefinition.components,
    info: {
      name: "Pineapple",
      description: "A pineapple ready for harvest",
      tooltipDescription: ["Provides food resource", "Send workers to harvest"],
      smallImage: { key: "crops", frame: "crops/pineapple/16.png", origin: { x: 0.5, y: 0.5 } }
    }
  }
} satisfies PrefabDefinition;

export const cropsPumpkinDefinition = {
  ...cropDefinition,
  components: {
    ...cropDefinition.components,
    info: {
      name: "Pumpkin",
      description: "A ripe pumpkin ready for harvest",
      tooltipDescription: ["Provides food resource", "Send workers to harvest"],
      smallImage: { key: "crops", frame: "crops/pumpkin/12.png", origin: { x: 0.5, y: 0.5 } }
    }
  }
} satisfies PrefabDefinition;

export const cropsSunflowersDefinition = {
  ...cropDefinition,
  components: {
    ...cropDefinition.components,
    info: {
      name: "Sunflowers",
      description: "Sunflowers ready for harvest",
      tooltipDescription: ["Provides food resource", "Send workers to harvest"],
      smallImage: { key: "crops", frame: "crops/sunflowers/16.png", origin: { x: 0.5, y: 0.5 } }
    }
  }
} satisfies PrefabDefinition;

export const cropsWheatDefinition = {
  ...cropDefinition,
  components: {
    ...cropDefinition.components,
    info: {
      name: "Wheat",
      description: "A field of wheat ready for harvest",
      tooltipDescription: ["Provides food resource", "Send workers to harvest"],
      smallImage: { key: "crops", frame: "crops/wheat/20.png", origin: { x: 0.5, y: 0.5 } }
    }
  }
} satisfies PrefabDefinition;

export const cropsZucchiniDefinition = {
  ...cropDefinition,
  components: {
    ...cropDefinition.components,
    info: {
      name: "Zucchini",
      description: "Zucchini ready for harvest",
      tooltipDescription: ["Provides food resource", "Send workers to harvest"],
      smallImage: { key: "crops", frame: "crops/zucchini/12.png", origin: { x: 0.5, y: 0.5 } }
    }
  }
} satisfies PrefabDefinition;

export const groundBoletusDefinition = {
  ...cropDefinition,
  components: {
    ...cropDefinition.components,
    info: {
      name: "Boletus",
      description: "Wild boletus mushrooms ready for harvest",
      tooltipDescription: ["Provides food resource", "Send workers to harvest"],
      smallImage: { key: "crops", frame: "ground/boletus/3.png", origin: { x: 0.5, y: 0.5 } }
    }
  }
} satisfies PrefabDefinition;

export const groundCarrotDefinition = {
  ...cropDefinition,
  components: {
    ...cropDefinition.components,
    info: {
      name: "Carrot",
      description: "Carrots ready for harvest",
      tooltipDescription: ["Provides food resource", "Send workers to harvest"],
      smallImage: { key: "crops", frame: "ground/carrot/0.png", origin: { x: 0.5, y: 0.5 } }
    }
  }
} satisfies PrefabDefinition;

export const groundChampignonsDefinition = {
  ...cropDefinition,
  components: {
    ...cropDefinition.components,
    info: {
      name: "Champignons",
      description: "Wild champignon mushrooms ready for harvest",
      tooltipDescription: ["Provides food resource", "Send workers to harvest"],
      smallImage: { key: "crops", frame: "ground/champignons/9.png", origin: { x: 0.5, y: 0.5 } }
    }
  }
} satisfies PrefabDefinition;

export const groundTurnipDefinition = {
  ...cropDefinition,
  components: {
    ...cropDefinition.components,
    info: {
      name: "Turnip",
      description: "Turnips ready for harvest",
      tooltipDescription: ["Provides food resource", "Send workers to harvest"],
      smallImage: { key: "crops", frame: "ground/turnip/6.png", origin: { x: 0.5, y: 0.5 } }
    }
  }
} satisfies PrefabDefinition;
