import { treeDefinitions } from "./tree.definition";
import type { PrefabDefinition } from "../../../../../data/prefab-definition";

export const tree7Definition = {
  ...treeDefinitions,
  components: {
    ...treeDefinitions.components,
    resourceSource: {
      ...treeDefinitions.components!.resourceSource!,
      maximumResources: 60
    },
    representable: {
      width: 128,
      height: 256
    }
  }
} satisfies PrefabDefinition;
