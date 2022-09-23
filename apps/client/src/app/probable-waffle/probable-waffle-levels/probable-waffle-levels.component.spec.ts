import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProbableWaffleLevelsComponent } from './probable-waffle-levels.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('ProbableWaffleLevelsComponent', () => {
  let component: ProbableWaffleLevelsComponent;
  let fixture: ComponentFixture<ProbableWaffleLevelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProbableWaffleLevelsComponent],
      imports: [RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ProbableWaffleLevelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
