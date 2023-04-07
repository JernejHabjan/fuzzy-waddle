import { Component } from '@angular/core';
import { MapIds } from '../../game/world/scenes/scenes';
import { MapPlayerDefinition } from '../skirmish/skirmish.component';
import { Router } from '@angular/router';

type EditorMap = { name: string; id: MapIds; imageSrc?: string };

@Component({
  selector: 'fuzzy-waddle-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent {
  constructor(private readonly router: Router) {}

  maps: EditorMap[] = [
    { name: 'Grassland Small', id: MapIds.GrasslandSmall, imageSrc: 'assets/probable-waffle/tilemaps/start-small.png' },
    { name: 'Grassland Large', id: MapIds.GrasslandLarge, imageSrc: 'assets/probable-waffle/tilemaps/start-large.png' }
  ];

  loadMap(map: EditorMap) {
    // todo
  }

  startMap($event: MapPlayerDefinition) {
    // todo
  }

  leave() {
    this.router.navigate(['/probable-waffle']);
  }
}
