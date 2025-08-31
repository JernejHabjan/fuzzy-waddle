import type { PrefabDefinition } from "../../../../../data/actor-definitions";
import { treeDefinitions } from "./tree.definition";

export const tree9Definition = {
  ...treeDefinitions,
  components: {
    ...treeDefinitions.components,
    resourceSource: {
      ...treeDefinitions.components!.resourceSource!,
      maximumResources: 120
    },
    representable: {
      width: 256,
      height: 384
    }
  }
} satisfies PrefabDefinition;
