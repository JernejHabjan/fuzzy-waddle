import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TileSelectorComponent } from './tile-selector.component';
import { MapDefinitions } from '../../../../game/world/const/map-size.info';
import { AtlasDisplayTestingComponent } from '../atlas-display/atlas-display.component.spec';

describe('TileSelectorComponent', () => {
  let component: TileSelectorComponent;
  let fixture: ComponentFixture<TileSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TileSelectorComponent, AtlasDisplayTestingComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TileSelectorComponent);
    component = fixture.componentInstance;
    component.frameWithMeta = {
      filename: 'cube-1.png',
      tileProperties: {
        stepHeight: 32
      },
      id: 1,
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
