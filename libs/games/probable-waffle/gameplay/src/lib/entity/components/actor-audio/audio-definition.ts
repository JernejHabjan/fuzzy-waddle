import { SoundType } from "./sound-type";

import type { SoundDefinition } from "./sound-definition";

export interface AudioDefinition {
  sounds: {
    [key: string | SoundType]: SoundDefinition[];
  };
}
