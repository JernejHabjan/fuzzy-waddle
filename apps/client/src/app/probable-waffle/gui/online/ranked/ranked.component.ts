import { Component } from "@angular/core";
import { FactionDefinitions } from "../../../game/player/faction-definitions";
import { FactionType, ProbableWaffleLevels } from "@fuzzy-waddle/api-interfaces";

type RankedLevel = { id: number; name: string; checked: boolean; imagePath: string };
type RankedOptions = {
  factionType: FactionType | null;
  nrOfPlayers: number;
  levels: RankedLevel[];
};
@Component({
  selector: "fuzzy-waddle-ranked",
  templateUrl: "./ranked.component.html",
  styleUrls: ["./ranked.component.scss"]
})
export class RankedComponent {
  protected readonly FactionDefinitions = FactionDefinitions;
  protected searching = false;
  protected readonly rankedOptions: RankedOptions;

  constructor() {
    this.rankedOptions = {
      factionType: this.lastPlayedFactionType,
      nrOfPlayers: this.nrOfPlayersOptions[0],
      levels: this.levels
    };
  }

  private get lastPlayedFactionType(): FactionType | null {
    // load it from local storage
    const factionType = localStorage.getItem("last-played-faction-type");
    if (factionType) {
      // try parse in FactionType enum
      // convert to int
      const factionTypeInt = parseInt(factionType, 10);
      const factionTypeEnum = FactionType[factionTypeInt];
      if (factionTypeEnum) {
        return factionTypeInt;
      }
    }
    return null;
  }

  protected factionChanged() {
    localStorage.setItem("last-played-faction-type", this.rankedOptions.factionType?.toString() ?? "");
  }

  private get levels(): RankedLevel[] {
    return Object.values(ProbableWaffleLevels).map((level) => ({
      id: level.id,
      name: level.name,
      checked: true,
      imagePath: level.presentation.imagePath
    }));
  }

  protected get nrOfPlayersOptions(): number[] {
    const options = new Set<number>();
    Object.values(ProbableWaffleLevels).forEach((level) => {
      options.add(level.mapInfo.startPositionsOnTile.length);
    });
    return Array.from(options);
  }

  protected startSearching() {
    this.searching = true;
    // todo
  }

  protected cancelSearching() {
    this.searching = false;
    // todo
  }
}
