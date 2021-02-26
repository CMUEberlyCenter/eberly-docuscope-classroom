import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { MessageService } from "../message.service";
import { MessagesComponent } from "./messages.component";

describe("MessagesComponent", () => {
  let component: MessagesComponent;
  let fixture: ComponentFixture<MessagesComponent>;

  beforeEach(
    waitForAsync(() => {
      const message_service_spy = jasmine.createSpyObj("MessageService", [
        "add",
        "clear",
      ]);
      message_service_spy.messages = [];

      TestBed.configureTestingModule({
        declarations: [MessagesComponent],
        providers: [{ provide: MessageService, useValue: message_service_spy }],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
