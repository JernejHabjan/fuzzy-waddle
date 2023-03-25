import { Component } from '@angular/core';
import { MapIds } from '../../game/world/scenes/scenes';
import { MapPlayerDefinition } from '../skirmish/skirmish.component';

type EditorMap = { name: string; id: MapIds };

@Component({
  selector: 'fuzzy-waddle-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent {
  maps: EditorMap[] = [
    { name: 'Grassland Small', id: MapIds.GrasslandSmall },
    { name: 'Grassland Large', id: MapIds.GrasslandLarge }
  ];

  loadMap(map: EditorMap) {
    // todo
  }

  startMap($event: MapPlayerDefinition) {
    // todo
  }
}
