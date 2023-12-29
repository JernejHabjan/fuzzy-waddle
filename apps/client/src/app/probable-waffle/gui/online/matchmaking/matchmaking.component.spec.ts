import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MatchmakingComponent } from "./matchmaking.component";
import { FormsModule } from "@angular/forms";
import { Component } from "@angular/core";
import { RoomsService } from "../../../communicators/rooms/rooms.service";
import { roomsServiceStub } from "../../../communicators/rooms/rooms.service.spec";

@Component({ selector: "probable-waffle-matchmaking", template: "" })
export class MatchmakingTestingComponent {}

describe("MatchmakingComponent", () => {
  let component: MatchmakingComponent;
  let fixture: ComponentFixture<MatchmakingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: RoomsService, useValue: roomsServiceStub }],
      declarations: [MatchmakingComponent],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MatchmakingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
