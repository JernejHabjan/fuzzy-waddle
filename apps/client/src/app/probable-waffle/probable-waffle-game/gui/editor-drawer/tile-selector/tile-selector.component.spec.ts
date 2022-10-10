import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TileSelectorComponent } from './tile-selector.component';

describe('TileSelectorComponent', () => {
  let component: TileSelectorComponent;
  let fixture: ComponentFixture<TileSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TileSelectorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TileSelectorComponent);
    component = fixture.componentInstance;
    component.frameWithMeta = {
      filename: "cube-1.png",
      frame: {
        y: 0,
        x: 0,
        w: 0,
        h: 0
      }
    };
    component.tileId = 0;
    component.textureName = 'iso-64x64-outside';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
