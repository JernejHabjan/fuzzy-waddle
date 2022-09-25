import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as Phaser from 'phaser';
import {SceneCommunicatorService} from './event-emitters/scene-communicator.service';
import {probableWaffleGameConfig} from "./const/game-config";

@Component({
  selector: 'fuzzy-waddle-probable-waffle-game',
  templateUrl: './probable-waffle-game.component.html',
  styleUrls: ['./probable-waffle-game.component.scss']
})
export class ProbableWaffleGameComponent implements OnInit, OnDestroy {
  gameRef!: Phaser.Game;
  collapsed = false;
  nrReplacedTiles = 3;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnDestroy(): void {
    this.gameRef.destroy(true);
    SceneCommunicatorService.unsubscribe();
  }

  ngOnInit(): void {
    SceneCommunicatorService.setup();
    this.nrReplacedTilesChanged();

    this.gameRef = new Phaser.Game(probableWaffleGameConfig);
  }

  emitEvent() {
    SceneCommunicatorService.testEmitterSubject.next(10);
  }

  leave() {
    this.router.navigate(['probable-waffle/levels']);
  }

  deselectTile() {
    SceneCommunicatorService.tileEmitterSubject.next(null);
  }

  tile1() {
    SceneCommunicatorService.tileEmitterSubject.next(4);
  }

  tile2() {
    SceneCommunicatorService.tileEmitterSubject.next(5);
  }

  nrReplacedTilesChanged(){
    SceneCommunicatorService.tileEmitterNrSubject.next(this.nrReplacedTiles);
  }
}
