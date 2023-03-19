import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileNavComponent } from './profile-nav.component';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { HomeNavTestingComponent } from '../../../shared/components/home-nav/home-nav.component.spec';

@Component({ selector: 'fuzzy-waddle-profile-nav', template: '' })
export class ProfileNavTestingComponent {}
describe('ProfileNavComponent', () => {
  let component: ProfileNavComponent;
  let fixture: ComponentFixture<ProfileNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfileNavComponent, HomeNavTestingComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
