import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PlayerDefinitionComponent } from "./player-definition.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { FormsModule } from "@angular/forms";
import { Component } from "@angular/core";

@Component({ selector: "probable-waffle-player-definition", template: "" })
export class PlayerDefinitionTestingComponent {}

describe("PlayerDefinitionComponent", () => {
  let component: PlayerDefinitionComponent;
  let fixture: ComponentFixture<PlayerDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlayerDefinitionComponent],
      imports: [FontAwesomeTestingModule, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
