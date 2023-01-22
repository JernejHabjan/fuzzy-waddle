import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapDefinitionComponent } from './map-definition.component';
import { FormsModule } from '@angular/forms';

describe('MapDefinitionComponent', () => {
  let component: MapDefinitionComponent;
  let fixture: ComponentFixture<MapDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapDefinitionComponent],
      imports:[FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MapDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
