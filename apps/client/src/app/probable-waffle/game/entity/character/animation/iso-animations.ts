export enum AnimDirectionEnum {
  north = "north",
  east = "east",
  south = "south",
  west = "west"
}

export const IsoAngleToAnimDirectionEnum: Record<string, AnimDirection> = {
  "-135": AnimDirectionEnum.north, // up
  "-90": AnimDirectionEnum.east, // right up
  "-45": AnimDirectionEnum.east, // right
  "0": AnimDirectionEnum.east, // right down
  "45": AnimDirectionEnum.south, // down
  "90": AnimDirectionEnum.west, // left down
  "135": AnimDirectionEnum.west, // left
  "180": AnimDirectionEnum.west // left up
};

export type AnimDirection =
  | AnimDirectionEnum.north
  | AnimDirectionEnum.west
  | AnimDirectionEnum.south
  | AnimDirectionEnum.east;
