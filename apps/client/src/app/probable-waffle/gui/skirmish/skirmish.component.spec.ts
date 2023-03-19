import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkirmishComponent } from './skirmish.component';
import { PlayerDefinitionComponent } from './player-definition/player-definition.component';
import { MapSelectorComponent } from './map-selector/map-selector.component';
import { MapDefinitionComponent } from './map-definition/map-definition.component';
import { GameModeDefinitionComponent } from './game-mode-definition/game-mode-definition.component';
import { FormsModule } from '@angular/forms';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';

@Component({ selector: 'fuzzy-waddle-skirmish', template: '' })
export class SkirmishTestingComponent {}

describe('SkirmishComponent', () => {
  let component: SkirmishComponent;
  let fixture: ComponentFixture<SkirmishComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        SkirmishComponent,
        PlayerDefinitionComponent,
        MapSelectorComponent,
        MapDefinitionComponent,
        GameModeDefinitionComponent
      ],
      imports: [FormsModule, FontAwesomeTestingModule],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(SkirmishComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
