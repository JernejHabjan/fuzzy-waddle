import { treeDefinitions } from "./tree.definition";
import type { PrefabDefinition } from "../../../../../data/prefab-definition";

export const tree6Definition = {
  ...treeDefinitions,
  components: {
    ...treeDefinitions.components,
    resourceSource: {
      ...treeDefinitions.components!.resourceSource!,
      maximumResources: 60
    },
    representable: {
      width: 128,
      height: 384
    }
  }
} satisfies PrefabDefinition;
