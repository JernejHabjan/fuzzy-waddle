import { Component } from '@angular/core';

@Component({
  selector: 'fly-squasher-high-score',
  templateUrl: './high-score.component.html',
  styleUrls: ['./high-score.component.scss']
})
export class HighScoreComponent {
  protected readonly highScores = [
    { name: 'Liam Thompson', level: 'First level', score: 100 },
    { name: 'Ava Ramirez', level: 'First level', score: 200 },
    { name: 'Ethan Patel', level: 'First level', score: 300 }
  ];
}
