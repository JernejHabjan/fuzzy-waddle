import { treeDefinitions } from "./tree.definition";
import type { PrefabDefinition } from "../../../../../data/prefab-definition";

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
