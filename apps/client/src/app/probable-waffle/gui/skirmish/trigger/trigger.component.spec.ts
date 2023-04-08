import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TriggerComponent } from './trigger.component';
import { RouterTestingModule } from '@angular/router/testing';
import { Component, Input } from '@angular/core';
import { MapPlayerDefinition } from '../skirmish.component';

@Component({ selector: 'fuzzy-waddle-trigger', template: '' })
export class TriggerTestingComponent {
  @Input() selectedMap?: MapPlayerDefinition;
}

describe('TriggerComponent', () => {
  let component: TriggerComponent;
  let fixture: ComponentFixture<TriggerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TriggerComponent],
      imports: [RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TriggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});