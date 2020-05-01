import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesComponent } from './messages.component';
import { MessageService } from '../message.service';

describe('MessagesComponent', () => {
  let component: MessagesComponent;
  let fixture: ComponentFixture<MessagesComponent>;

  beforeEach(async(() => {
    const message_service_spy = jasmine.createSpyObj('MessageService', ['add', 'clear']);
    message_service_spy.messages = [];

    TestBed.configureTestingModule({
      declarations: [ MessagesComponent ],
      providers: [
        { provide: MessageService, useValue: message_service_spy }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
