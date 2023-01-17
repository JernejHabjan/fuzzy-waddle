import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProbableWaffleHomeComponent } from './probable-waffle-home.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('ProbableWaffleHomeComponent', () => {
  let component: ProbableWaffleHomeComponent;
  let fixture: ComponentFixture<ProbableWaffleHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProbableWaffleHomeComponent],
      imports: [RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ProbableWaffleHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
