import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MapIds, Maps } from '../../../probable-waffle-game/scenes/scenes';
import { MapPlayerDefinition } from '../probable-waffle-skirmish.component';

@Component({
  selector: 'fuzzy-waddle-probable-waffle-map-selector',
  templateUrl: './probable-waffle-map-selector.component.html',
  styleUrls: ['./probable-waffle-map-selector.component.scss']
})
export class ProbableWaffleMapSelectorComponent implements OnInit {
  dropdownVisible = false;
  mapPlayerDefinitions: MapPlayerDefinition[];
  selectedMap?: MapPlayerDefinition;
  @Output() selectedMapChange: EventEmitter<MapPlayerDefinition> = new EventEmitter<MapPlayerDefinition>();
  private readonly defaultMap = MapIds.GrasslandLarge;
  constructor() {
    this.mapPlayerDefinitions = Maps.maps.map((map) => new MapPlayerDefinition(map));
  }

  selectMap(mapPlayerDefinition: MapPlayerDefinition) {
    this.selectedMap = mapPlayerDefinition;
    this.selectedMapChange.emit(this.selectedMap);
    this.dropdownVisible = false;
  }

  ngOnInit(): void {
    const defaultMap = this.mapPlayerDefinitions.find(
      (mapPlayerDefinition) => mapPlayerDefinition.map.id === this.defaultMap
    ) as MapPlayerDefinition;
    this.selectMap(defaultMap);
  }
}
