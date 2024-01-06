import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChatFloatComponent } from "./chat-float.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ChatFloatComponent", () => {
  let component: ChatFloatComponent;
  let fixture: ComponentFixture<ChatFloatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatFloatComponent, FontAwesomeTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatFloatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
