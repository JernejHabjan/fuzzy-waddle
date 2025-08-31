import { treeDefinitions } from "./tree.definition";
import type { PrefabDefinition } from "../../../../../data/prefab-definition";

export const tree11Definition = {
  ...treeDefinitions,
  components: {
    ...treeDefinitions.components,
    resourceSource: {
      ...treeDefinitions.components!.resourceSource!,
      maximumResources: 80
    },
    representable: {
      width: 184,
      height: 184
    }
  }
} satisfies PrefabDefinition;
