import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnlineComponent } from './online.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { provideRouter } from '@angular/router';
import { HomeNavTestingComponent } from '../../../shared/components/home-nav/home-nav.component.spec';
import { RankedTestingComponent } from './ranked/ranked.component.spec';

describe('OnlineComponent', () => {
  let component: OnlineComponent;
  let fixture: ComponentFixture<OnlineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OnlineComponent, HomeNavTestingComponent, RankedTestingComponent],
      imports: [NgbModule],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(OnlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
