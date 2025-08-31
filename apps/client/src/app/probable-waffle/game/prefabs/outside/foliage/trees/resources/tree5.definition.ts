import type { PrefabDefinition } from "../../../../../data/actor-definitions";
import { treeDefinitions } from "./tree.definition";

export const tree5Definition = {
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
