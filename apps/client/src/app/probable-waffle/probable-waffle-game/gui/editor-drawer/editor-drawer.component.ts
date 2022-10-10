import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SceneCommunicatorService } from '../../event-emitters/scene-communicator.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AtlasFrame, AtlasJsonWrapper, AtlasLoaderService, TileAtlasFrame, TileFrame } from './atlas-loader.service';
import { MapDefinitions } from '../../const/map-size.info';
import { TileTypes } from '../../manual-tiles/tile-types';

type TileType = 'flat' | 'water' | 'slopes' | 'blocks' | 'other';

@Component({
  selector: 'fuzzy-waddle-editor-drawer',
  templateUrl: './editor-drawer.component.html',
  styleUrls: ['./editor-drawer.component.scss']
})
export class EditorDrawerComponent implements OnInit {
  MapDefinitions = MapDefinitions;
  nrReplacedTiles = SceneCommunicatorService.DEFAULT_TILE_REPLACE;
  layerNr = SceneCommunicatorService.DEFAULT_LAYER;
  tileAtlasFrames: TileAtlasFrame[] | null = null;
  spriteAtlases: AtlasJsonWrapper[] | null = null;

  tileTypes: { tileType: TileType; fn: (frameWithMeta: TileFrame) => boolean }[] = [
    { tileType: 'flat', fn: TileTypes.getWalkableHeight0 },
    { tileType: 'water', fn: TileTypes.getWalkableWater },
    { tileType: 'slopes', fn: TileTypes.getWalkableSlopes },
    { tileType: 'blocks', fn: TileTypes.getWalkableHeightBlock },
    { tileType: 'other', fn: TileTypes.getOtherTiles }
  ];
  selectedType: { tileType: TileType; fn: (frameWithMeta: TileFrame) => boolean };

  constructor(private route: ActivatedRoute, private router: Router, private atlasLoaderService: AtlasLoaderService) {
    this.selectedType = this.tileTypes[0];
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadMapAtlas(), this.loadSpriteAtlases()]);
  }

  deselectTile() {
    SceneCommunicatorService.tileEmitterSubject.next(null);
  }
  removeTile() {
    SceneCommunicatorService.tileEmitterSubject.next(-1);
  }

  selectAtlas(tilesetName: string, atlasFrame: AtlasFrame) {
    // todo make sure to border the selected atlas
    SceneCommunicatorService.atlasEmitterSubject.next({ tilesetName, atlasFrame: atlasFrame });
  }

  nrReplacedTilesChanged() {
    SceneCommunicatorService.tileEmitterNrSubject.next(this.nrReplacedTiles);
  }

  layerNrChanged() {
    SceneCommunicatorService.layerEmitterSubject.next(this.layerNr);
  }

  async loadMapAtlas() {
    this.tileAtlasFrames = await this.atlasLoaderService.loadMap();
  }

  async loadSpriteAtlases() {
    this.spriteAtlases = [await this.atlasLoaderService.loadAtlasJson(MapDefinitions.atlasMegaset)];
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

  formatAtlasFileName(filename: string) {
    // replace "_" with " "
    return filename.replace(/_/g, ' ');
  }
}
