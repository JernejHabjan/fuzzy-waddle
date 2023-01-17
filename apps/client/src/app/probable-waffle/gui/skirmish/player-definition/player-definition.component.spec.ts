import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerDefinitionComponent } from './player-definition.component';

describe('PlayerDefinitionComponent', () => {
  let component: PlayerDefinitionComponent;
  let fixture: ComponentFixture<PlayerDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlayerDefinitionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
