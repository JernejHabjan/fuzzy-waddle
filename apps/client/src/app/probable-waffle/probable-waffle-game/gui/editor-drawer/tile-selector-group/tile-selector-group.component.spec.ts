import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TileSelectorGroupComponent } from './tile-selector-group.component';

describe('TileSelectorGroupComponent', () => {
  let component: TileSelectorGroupComponent;
  let fixture: ComponentFixture<TileSelectorGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TileSelectorGroupComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TileSelectorGroupComponent);
    component = fixture.componentInstance;
    component.atlasFrames = [];
    component.frameWithMetaFilter = () => true;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
