import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomePageComponent } from './home-page.component';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { HomePageNavTestingComponent } from './home-page-nav/home-page-nav.component.spec';
import { provideRouter } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('HomePageComponent', () => {
  let component: HomePageComponent;
  let fixture: ComponentFixture<HomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomePageComponent, HomePageNavTestingComponent],
      imports: [
        FontAwesomeTestingModule,
        RouterTestingModule,
        HttpClientTestingModule // todo remove httpClient from view!
      ],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
