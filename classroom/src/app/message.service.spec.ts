import { TestBed } from '@angular/core/testing';
import { MessageService } from './message.service';

describe('MessageService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [MessageService],
    })
  );

  it('should be created', () => {
    const service: MessageService = TestBed.inject(MessageService);
    void expect(service).toBeTruthy();
  });

  it('add', () => {
    const service: MessageService = TestBed.inject(MessageService);
    console.log = jasmine.createSpy('log');
    service.add('message');
    expect(console.log).toHaveBeenCalledWith('message');
    void expect(service.messages).toEqual(['message']);
    service.debug = false;
    service.add('no console');
    void expect(console.log).toHaveBeenCalledTimes(1);
    void expect(service.messages).toEqual(['message', 'no console']);
  });

  it('clear', () => {
    const service: MessageService = TestBed.inject(MessageService);
    void expect(service.messages).toEqual([]);
    service.add('message');
    void expect(service.messages).toEqual(['message']);
    service.clear();
    void expect(service.messages).toEqual([]);
  });
});
