import { Component } from '@angular/core';
import { flySquasherLevels } from '../consts/levels';

@Component({
  selector: 'fly-squasher-choose-level',
  templateUrl: './choose-level.component.html',
  styleUrls: ['./choose-level.component.scss']
})
export class ChooseLevelComponent {
  protected readonly flySquasherLevels = flySquasherLevels;
}
