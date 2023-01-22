import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapSelectorComponent } from './map-selector.component';
import { FormsModule } from '@angular/forms';

describe('MapSelectorComponent', () => {
  let component: MapSelectorComponent;
  let fixture: ComponentFixture<MapSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapSelectorComponent],
      imports:[FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MapSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
