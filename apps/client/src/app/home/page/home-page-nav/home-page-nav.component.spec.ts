import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePageNavComponent } from './home-page-nav.component';

describe('HomePageNavComponent', () => {
  let component: HomePageNavComponent;
  let fixture: ComponentFixture<HomePageNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomePageNavComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
