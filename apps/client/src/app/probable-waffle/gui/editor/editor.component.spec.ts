import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorComponent } from './editor.component';
import { provideRouter } from '@angular/router';
import { MapSelectorTestingComponent } from '../skirmish/map-selector/map-selector.component.spec';
import { HomeNavTestingComponent } from '../../../shared/components/home-nav/home-nav.component.spec';

describe('EditorComponent', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditorComponent, MapSelectorTestingComponent, HomeNavTestingComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
