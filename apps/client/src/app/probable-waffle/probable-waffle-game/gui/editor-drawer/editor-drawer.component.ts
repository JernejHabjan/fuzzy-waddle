import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SceneCommunicatorService } from '../../event-emitters/scene-communicator.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Atlas, AtlasLoaderService, FrameWithMeta } from './atlas-loader.service';

@Component({
  selector: 'fuzzy-waddle-editor-drawer',
  templateUrl: './editor-drawer.component.html',
  styleUrls: ['./editor-drawer.component.scss']
})
export class EditorDrawerComponent implements OnInit {
  nrReplacedTiles = 3;
  @Output() drawerCollapsed: EventEmitter<boolean> = new EventEmitter<boolean>();
  outsideAtlasFrames: FrameWithMeta[] | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private atlasLoaderService: AtlasLoaderService) {}

  ngOnInit(): void {
    this.nrReplacedTilesChanged();
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

  loadOutsideAtlas() {
    this.atlasLoaderService.load().then((frames) => (this.outsideAtlasFrames = frames));
  }

  leave() {
    this.router.navigate(['probable-waffle/levels']);
  }
}
