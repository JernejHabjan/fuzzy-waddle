import type { PrefabDefinition } from "../../../../../data/actor-definitions";

export const tree4Definition = {
  ...treeDefinitions,
  components: {
    ...treeDefinitions.components,
    resourceSource: {
      ...treeDefinitions.components!.resourceSource!,
      maximumResources: 40
    },
    representable: {
      width: 128,
      height: 256
    }
  }
} satisfies PrefabDefinition;
