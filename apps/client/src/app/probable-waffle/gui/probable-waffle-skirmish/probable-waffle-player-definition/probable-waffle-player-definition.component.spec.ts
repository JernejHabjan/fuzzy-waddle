import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProbableWafflePlayerDefinitionComponent } from './probable-waffle-player-definition.component';

describe('ProbableWafflePlayerDefinitionComponent', () => {
  let component: ProbableWafflePlayerDefinitionComponent;
  let fixture: ComponentFixture<ProbableWafflePlayerDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProbableWafflePlayerDefinitionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProbableWafflePlayerDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
