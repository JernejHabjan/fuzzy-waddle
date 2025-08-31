import {
  Component,
  effect,
  EventEmitter,
  inject,
  input,
  model,
  type OnDestroy,
  type OnInit,
  Output
} from "@angular/core";

import { ProbableWaffleLevels, ProbableWaffleMapData, ProbableWaffleMapEnum } from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../../../environments/environment";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { Subscription } from "rxjs";
import { SceneCommunicatorClientService } from "../../../communicators/scene-communicator-client.service";
import { AuthService } from "../../../../auth/auth.service";

@Component({
  selector: "probable-waffle-map-browser",
  templateUrl: "./map-browser.component.html",
  styleUrls: ["./map-browser.component.scss"],
  standalone: true
})
export class MapBrowserComponent implements OnInit, OnDestroy {
  // Using the new input signal approach
  searchQuery = input<string>("");
  selectedMapId = model<ProbableWaffleMapEnum | null>(null);
  @Output() selectedMapIdChange = new EventEmitter<ProbableWaffleMapEnum>();

  maps: ProbableWaffleMapData[] = [];
  filteredMaps: ProbableWaffleMapData[] = [];

  private subscriptions: Subscription[] = [];
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly sceneCommunicatorClientService = inject(SceneCommunicatorClientService);
  private readonly authService = inject(AuthService);

  constructor() {
    // Use effect to react to changes in searchQuery
    effect(() => {
      // This will automatically run whenever searchQuery changes
      this.filterMaps(this.searchQuery());
    });
  }

  ngOnInit() {
    // Using the levels getter from map-selector
    this.maps = Object.values(ProbableWaffleLevels).filter((level) => (environment.production ? !level.devOnly : true));
    this.filterMaps(this.searchQuery());

    // Listen for map changes to update the selected map ID
    this.listenToMapChanges();

    // Check if map is already selected when joining as a second player
    this.checkInitialMapSelection();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Checks for an already selected map when joining an existing lobby
   */
  private checkInitialMapSelection() {
    const mapId = this.gameInstanceClientService.gameInstance?.gameMode?.data.map;
    if (mapId && !this.selectedMapId()) {
      // Set the map ID without triggering selection logic since it's already selected in the game instance
      this.selectedMapId.set(mapId);
      this.selectedMapIdChange.emit(mapId);
    }
  }

  private listenToMapChanges() {
    const communicators = this.sceneCommunicatorClientService.communicatorObservables;
    if (!communicators) return;

    this.subscriptions.push(
      communicators.gameModeObservable.subscribe((payload) => {
        if (payload.property === "map") {
          // Update the selectedMapId when the map changes through other means
          const mapId = this.gameInstanceClientService.gameInstance?.gameMode?.data.map;
          if (mapId && this.selectedMapId() !== mapId) {
            this.selectedMapId.set(mapId);
            this.selectedMapIdChange.emit(mapId);
          }
        }
      })
    );
  }

  get isHost(): boolean {
    return this.gameInstanceClientService.gameInstance?.isHost(this.authService.userId) ?? false;
  }

  async selectMap(mapId: ProbableWaffleMapEnum) {
    // Only hosts can change the map
    if (!this.isHost) return;

    // Set the local state
    this.selectedMapId.set(mapId);
    this.selectedMapIdChange.emit(mapId);

    // Add the map selection functionality from map-selector component
    await this.removeExtraPlayers(mapId);
    await this.gameInstanceClientService.gameModeChanged("map", { map: mapId });
  }

  /**
   * Before changing map, throw out all players that don't fit in this new map
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

  filterMaps(query: string) {
    if (!query) {
      this.filteredMaps = this.maps;
    } else {
      const queryLower = query.toLowerCase();
      this.filteredMaps = this.maps.filter((map) => map.name.toLowerCase().includes(queryLower));
    }
  }
}
