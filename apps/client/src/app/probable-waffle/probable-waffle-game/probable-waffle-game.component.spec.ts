import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProbableWaffleGameComponent } from './probable-waffle-game.component';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

describe('ProbableWaffleGameComponent', () => {
  let component: ProbableWaffleGameComponent;
  let fixture: ComponentFixture<ProbableWaffleGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProbableWaffleGameComponent]}).compileComponents();

    fixture = TestBed.createComponent(ProbableWaffleGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
