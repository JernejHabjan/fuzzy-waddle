import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtlasDisplayComponent } from './atlas-display.component';
import { MapDefinitions } from '../../../../game/world/const/map-size.info';

describe('AtlasDisplayComponent', () => {
  let component: AtlasDisplayComponent;
  let fixture: ComponentFixture<AtlasDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AtlasDisplayComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AtlasDisplayComponent);
    component = fixture.componentInstance;
    component.atlasFrame = {
      filename: 'cube-1.png',
      frame: {
        y: 0,
        x: 0,
        w: 0,
        h: 0
      }
    };
    component.textureName = MapDefinitions.atlasOutside;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
