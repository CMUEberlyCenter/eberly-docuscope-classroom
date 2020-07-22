import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { HttpErrorHandlerService } from '../http-error-handler.service';
import { GroupsService } from './groups.service';
import { environment } from '../../environments/environment';

describe('GroupsService', () => {
  let service: GroupsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const heh_spy = jasmine.createSpyObj('HttpErrorHandlerService', ['createHandleError']);
    heh_spy.createHandleError.and.returnValue(() => (fn, data) => data);
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [
        { provide: HttpErrorHandlerService, useValue: heh_spy }
      ]
    });
    service = TestBed.inject(GroupsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getGroupsData', () => {
    const fake_groups = {
      groups: [['1', '2'], ['3', '4']], grp_qualities: [0, 0], quality: 0
    };

    service.getGroupsData(['1', '2', '3', '4'], 2).subscribe(data => {
      expect(data.quality).toBe(0);
    });
    const req = httpMock.expectOne(`${environment.backend_server}/groups`);
    expect(req.request.method).toBe('POST');
    req.flush(fake_groups);
  });
});