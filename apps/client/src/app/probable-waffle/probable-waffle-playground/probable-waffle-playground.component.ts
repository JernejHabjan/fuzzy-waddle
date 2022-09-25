import {Component} from '@angular/core';
import {ProbableWafflePlaygroundService} from './probable-waffle-playground.service';
import {Observable} from 'rxjs';
import {Message} from '@fuzzy-waddle/api-interfaces';

@Component({
  selector: 'fuzzy-waddle-probable-waffle-playground',
  templateUrl: './probable-waffle-playground.component.html',
  styleUrls: ['./probable-waffle-playground.component.scss']
})
export class ProbableWafflePlaygroundComponent{
  hello$: Observable<Message> = this.probableWafflePlaygroundService.getData();
  constructor(
    private probableWafflePlaygroundService: ProbableWafflePlaygroundService
  ) {}

}
