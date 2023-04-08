import { Component, EventEmitter, Output } from '@angular/core';
import { LittleMuncherHills } from '@fuzzy-waddle/api-interfaces';

@Component({
  selector: 'little-muncher-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  LittleMuncherHills = LittleMuncherHills;
  @Output() runGame: EventEmitter<LittleMuncherHills> = new EventEmitter<LittleMuncherHills>();

  climbOn(hillName: LittleMuncherHills) {
    this.runGame.next(hillName);
  }
}
