import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProbableWaffleMapDefinitionComponent } from './probable-waffle-map-definition.component';

describe('ProbableWaffleMapDefinitionComponent', () => {
  let component: ProbableWaffleMapDefinitionComponent;
  let fixture: ComponentFixture<ProbableWaffleMapDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProbableWaffleMapDefinitionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProbableWaffleMapDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
