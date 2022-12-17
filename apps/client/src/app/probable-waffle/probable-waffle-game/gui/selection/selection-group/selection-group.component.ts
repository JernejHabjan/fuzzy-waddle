import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'fuzzy-waddle-selection-group',
  templateUrl: './selection-group.component.html',
  styleUrls: ['./selection-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectionGroupComponent {}
