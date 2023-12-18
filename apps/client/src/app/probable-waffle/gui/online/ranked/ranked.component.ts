import { Component } from "@angular/core";
import { FactionDefinitions } from "../../../game/player/faction-definitions";
import { ProbableWaffleLevels } from "@fuzzy-waddle/api-interfaces";

@Component({
  selector: "fuzzy-waddle-ranked",
  templateUrl: "./ranked.component.html",
  styleUrls: ["./ranked.component.scss"]
})
export class RankedComponent {
  protected readonly FactionDefinitions = FactionDefinitions;
  protected readonly ProbableWaffleLevels = ProbableWaffleLevels;
  protected searching = false;
  protected rankedOptions = {
    factionType: undefined
  };

  protected start() {
    this.searching = true;
    // todo
  }
}
