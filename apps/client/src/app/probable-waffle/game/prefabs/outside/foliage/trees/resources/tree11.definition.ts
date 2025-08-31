import type { PrefabDefinition } from "../../../../../data/actor-definitions";

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
