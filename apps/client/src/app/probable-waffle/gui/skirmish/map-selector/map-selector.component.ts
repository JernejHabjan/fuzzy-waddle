import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MapIds, Maps } from '../../../game/world/scenes/scenes';
import { MapPlayerDefinition } from '../skirmish.component';

@Component({
  selector: 'fuzzy-waddle-map-selector',
  templateUrl: './map-selector.component.html',
  styleUrls: ['./map-selector.component.scss']
})
export class MapSelectorComponent implements OnInit {
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
