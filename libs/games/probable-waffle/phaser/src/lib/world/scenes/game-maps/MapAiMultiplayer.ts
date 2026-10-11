import MapAiOpenEconomy from "./MapAiOpenEconomy";

/** Frozen three-spawn counterpart to the focused economy map for real multiplayer relay scenarios. */
export default class MapAiMultiplayer extends MapAiOpenEconomy {
  constructor() {
    super("MapAiMultiplayer", true);
  }
}
