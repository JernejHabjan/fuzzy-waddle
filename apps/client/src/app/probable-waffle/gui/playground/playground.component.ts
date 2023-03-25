import { Component } from '@angular/core';
import { PlaygroundService } from './playground.service';
import { Observable } from 'rxjs';
import { Message } from '@fuzzy-waddle/api-interfaces';

@Component({
  selector: 'fuzzy-waddle-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss']
})
export class PlaygroundComponent {
  hello$: Observable<Message> = this.probableWafflePlaygroundService.getData();

  constructor(private probableWafflePlaygroundService: PlaygroundService) {}
}
