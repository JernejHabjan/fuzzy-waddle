import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionGroupComponent } from './selection-group.component';
import { SelectionDisplayTestingComponent } from '../selection-display/selection-display.component.spec';

describe('SelectionGroupComponent', () => {
  let component: SelectionGroupComponent;
  let fixture: ComponentFixture<SelectionGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectionGroupComponent, SelectionDisplayTestingComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectionGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
