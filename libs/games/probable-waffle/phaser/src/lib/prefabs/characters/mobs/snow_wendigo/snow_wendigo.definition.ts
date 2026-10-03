import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { wendigoDefinition } from "../forest_wendigo/forest_wendigo.definition";
import { ANIM_SNOW_WENDIGO_DEFINITION } from "./anims-snow_wendigo";

export const snowWendigoDefinition = {
  ...wendigoDefinition,
  components: {
    ...wendigoDefinition.components,
    info: {
      name: "Snow Wendigo",
      description:
        "A savage beast of the frozen wilderness that tears through enemies with brutal strength and primal abilities.",
      smallImage: {
        key: "factions",
        frame: "probable-waffle/spritesheets/characters/general/centurion/centurion_idle.png", // todo
        origin: { x: 0.5, y: 0.6 }
      }
    },
    animatable: { animations: ANIM_SNOW_WENDIGO_DEFINITION }
  }
} satisfies PrefabDefinition;
