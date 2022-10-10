import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SceneCommunicatorService } from '../../event-emitters/scene-communicator.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AtlasFrameWithMeta, AtlasLoaderService, FrameWithMeta } from './atlas-loader.service';
import { MapDefinitions } from '../../const/map-size.info';
import { TileTypes } from '../../manual-tiles/tile-types';

export type TileType = 'flat' | 'water' | 'slopes' | 'blocks' | 'other';
@Component({
  selector: 'fuzzy-waddle-editor-drawer',
  templateUrl: './editor-drawer.component.html',
  styleUrls: ['./editor-drawer.component.scss']
})
export class EditorDrawerComponent implements OnInit {
  MapDefinitions = MapDefinitions;
  nrReplacedTiles = 1;
  layerNr = 1; // todo for test defaults to layer 1
  @Output() drawerCollapsed: EventEmitter<boolean> = new EventEmitter<boolean>();
  atlasFrames: AtlasFrameWithMeta[] | null = null;

  tileTypes: { tileType: TileType; fn: (frameWithMeta: FrameWithMeta) => boolean }[] = [
    { tileType: 'flat', fn: TileTypes.getWalkableHeight0 },
    { tileType: 'water', fn: TileTypes.getWalkableWater },
    { tileType: 'slopes', fn: TileTypes.getWalkableSlopes },
    { tileType: 'blocks', fn: TileTypes.getWalkableHeightBlock },
    { tileType: 'other', fn: TileTypes.getOtherTiles }
  ];
  selectedType: { tileType: TileType; fn: (frameWithMeta: FrameWithMeta) => boolean };
  constructor(private route: ActivatedRoute, private router: Router, private atlasLoaderService: AtlasLoaderService) {
    this.selectedType = this.tileTypes[0];
  }

  ngOnInit(): void {
    this.nrReplacedTilesChanged();
    this.layerNrChanged();
    this.loadOutsideAtlas();
  }

  deselectTile() {
    SceneCommunicatorService.tileEmitterSubject.next(null);
  }
  removeTile() {
    SceneCommunicatorService.tileEmitterSubject.next(-1);
  }

  nrReplacedTilesChanged() {
    SceneCommunicatorService.tileEmitterNrSubject.next(this.nrReplacedTiles);
  }

  layerNrChanged() {
    SceneCommunicatorService.layerEmitterSubject.next(this.layerNr);
  }

  loadOutsideAtlas() {
    this.atlasLoaderService.load().then((frames) => (this.atlasFrames = frames));
  }

  leave() {
    this.router.navigate(['probable-waffle/levels']);
  }

  saveMap() {
    // todo
  }

  loadMap() {
    // todo
  }
}
