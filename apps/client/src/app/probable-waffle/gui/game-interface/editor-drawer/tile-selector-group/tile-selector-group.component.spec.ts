import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TileSelectorGroupComponent } from './tile-selector-group.component';
import { Component } from '@angular/core';

@Component({ selector: 'fuzzy-waddle-tile-selector-group', template: '' })
export class TileSelectorGroupTestingComponent {}

describe('TileSelectorGroupComponent', () => {
  let component: TileSelectorGroupComponent;
  let fixture: ComponentFixture<TileSelectorGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TileSelectorGroupComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TileSelectorGroupComponent);
    component = fixture.componentInstance;
    component.tileAtlasFrames = [];
    component.frameWithMetaFilter = () => true;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
