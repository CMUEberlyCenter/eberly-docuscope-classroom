import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { HttpErrorHandlerService } from '../http-error-handler.service';
import { GroupsService } from './groups.service';

describe('GroupsService', () => {
  let service: GroupsService;

  beforeEach(() => {
    const heh_spy = jasmine.createSpyObj('HttpErrorHandlerService', ['createHandleError']);
    heh_spy.createHandleError.and.returnValue(() => () => '');
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [
        { provide: HttpErrorHandlerService, useValue: heh_spy }
      ]
    });
    service = TestBed.inject(GroupsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
