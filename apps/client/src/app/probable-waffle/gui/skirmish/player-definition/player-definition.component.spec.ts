import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerDefinitionComponent } from './player-definition.component';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { FormsModule } from '@angular/forms';
import { Component, Input } from '@angular/core';
import { MapPlayerDefinition } from '../skirmish.component';

@Component({ selector: 'fuzzy-waddle-player-definition', template: '' })
export class PlayerDefinitionTestingComponent {
  @Input() selectedMap?: MapPlayerDefinition;
}

describe('PlayerDefinitionComponent', () => {
  let component: PlayerDefinitionComponent;
  let fixture: ComponentFixture<PlayerDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlayerDefinitionComponent],
      imports: [FontAwesomeTestingModule, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
