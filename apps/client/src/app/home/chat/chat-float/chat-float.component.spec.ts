import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ChatFloatComponent } from "./chat-float.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ChatService } from "../../../data-access/chat/chat.service";
import { chatServiceStub } from "../../../data-access/chat/chat.service.spec";

describe("ChatFloatComponent", () => {
  let component: ChatFloatComponent;
  let fixture: ComponentFixture<ChatFloatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatFloatComponent, FontAwesomeTestingModule],
      providers: [{ provide: ChatService, useValue: chatServiceStub }]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatFloatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
