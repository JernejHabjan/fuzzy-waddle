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
    const atlasUrl = 'assets/probable-waffle/atlas/iso-64x64-outside.json';

    component.frameWithMeta = {
      filename: atlasUrl,
      frame: {
        y: 0,
        x: 0,
        w: 0,
        h: 0
      }
    };
    component.tileId = 0;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
