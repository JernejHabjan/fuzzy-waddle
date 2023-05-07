import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePageNavComponent } from './home-page-nav.component';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { HomeNavTestingComponent } from '../../../shared/components/home-nav/home-nav.component.spec';

@Component({ selector: 'fuzzy-waddle-home-page-nav', template: '' })
export class HomePageNavTestingComponent {}

describe('HomePageNavComponent', () => {
  let component: HomePageNavComponent;
  let fixture: ComponentFixture<HomePageNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomePageNavComponent, HomeNavTestingComponent],
      imports: [FontAwesomeTestingModule],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
