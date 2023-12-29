import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChatComponent } from "./chat.component";
import { ChatService } from "../../../data-access/chat/chat.service";
import { FormsModule } from "@angular/forms";
import { AvatarProviderService } from "./avatar-provider/avatar-provider.service";
import { avatarProviderServiceStub } from "./avatar-provider/avatar-provider.service.spec";
import { chatServiceStub } from "../../../data-access/chat/chat.service.spec";

describe("ChatComponent", () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatComponent],
      providers: [
        { provide: ChatService, useValue: chatServiceStub },
        {
          provide: AvatarProviderService,
          useValue: avatarProviderServiceStub
        }
      ],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
