import { Component, inject } from "@angular/core";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { ProbableWaffleLevels, ProbableWaffleMapData, ProbableWaffleMapEnum } from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../../../environments/environment";

@Component({
  selector: "probable-waffle-map-selector",
  templateUrl: "./map-selector.component.html",
  styleUrls: ["./map-selector.component.scss"]
})
export class MapSelectorComponent {
  private readonly gameInstanceClientService = inject(GameInstanceClientService);

  protected async selectMap(map: ProbableWaffleMapEnum) {
    await this.removeExtraPlayers(map);
    await this.gameInstanceClientService.gameModeChanged("map", { map });
  }

  /**
   * before changing map, throw out all players that don't fit in this new map
   */
  private async removeExtraPlayers(map: ProbableWaffleMapEnum) {
    const mapData = ProbableWaffleLevels[map];
    const maxPlayers = mapData.mapInfo.startPositionsOnTile.length;
    const players = this.gameInstanceClientService.gameInstance?.players ?? [];
    const playersToRemove = players.filter((player) => player.playerNumber! > maxPlayers);
    for (const player of playersToRemove) {
      await this.gameInstanceClientService.removePlayer(player.playerNumber!);
    }
  }

  get levels(): ProbableWaffleMapData[] {
    return Object.values(ProbableWaffleLevels).filter((level) => (environment.production ? !level.devOnly : true));
  }
}
