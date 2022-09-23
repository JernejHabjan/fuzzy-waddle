import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as Phaser from 'phaser';
import { environment } from '../../../environments/environment';
import GrasslandScene from './scenes/grassland.scene';
import { SceneCommunicatorService } from './event-emitters/scene-communicator.service';

@Component({
  selector: 'fuzzy-waddle-probable-waffle-game',
  templateUrl: './probable-waffle-game.component.html',
  styleUrls: ['./probable-waffle-game.component.scss']
})
export class ProbableWaffleGameComponent implements OnInit, OnDestroy {
  gameRef!: Phaser.Game;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnDestroy(): void {
    this.gameRef.destroy(true);
    SceneCommunicatorService.unsubscribe();
  }

  ngOnInit(): void {
    SceneCommunicatorService.setup();

    // todo move this config to some other file
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      scene: [GrasslandScene],
      physics: {
        default: 'arcade',
        arcade: {
          debug: !environment.production
        }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: window.innerWidth,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        height: window.innerHeight
      },
      fps: {
        target: 60,
        min: 30
        // forceSetTimeOut: true
      },
      disableContextMenu: true
    };

    // var config = {
    //   type: Phaser.AUTO,
    //   width: 800,
    //   height: 600,
    //   physics: {
    //     default: 'arcade',
    //     arcade: {
    //       gravity: { y: 200 }
    //     }
    //   },
    //   scene: {
    //     preload: this.preload,
    //     create: this.create
    //   }
    // };

    this.gameRef = new Phaser.Game(config);
  }

  emitEvent() {
    SceneCommunicatorService.testEmitterSubject.next(10);
  }

  leave() {
    this.router.navigate(['probable-waffle/levels']);
  }
}
