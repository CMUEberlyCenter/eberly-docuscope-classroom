import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { category_value, DsDataService } from './ds-data.service';
import { environment } from './../environments/environment';
import { HttpErrorHandlerService } from './http-error-handler.service';

const data = {
  categories: [{q1: 1, q2: 2, q3: 3, min: 0, max: 4,
    uifence: 3.5, lifence: 0.5,
    id: 'bogus', name: 'Bogus Data'}],
  data: [{
    id: 'over_outlier', title: 'High Bogus Outlier', bogus: 4.5,
    total_words: 100, ownedby: 'student'
  }, {
    id: 'under_outlier', title: 'Low Bogus Outlier', bogus: .25,
    total_words: 100, ownedby: 'student'
  }, {
    id: 'noutlier', title: 'Non-Outlier', bogus: 2, total_words: 100,
    ownedby: 'instructor'
  }]
};

describe('DsDataService', () => {
  let service: DsDataService;
  // const corpus = ['1', '2', '3'];
  let httpMock: HttpTestingController;
  const server = `${environment.backend_server}/ds_data`;

  beforeEach(() => {
    const heh_spy = jasmine.createSpyObj('HttpErrorHandlerService', ['createHandleError']);
    heh_spy.createHandleError.and.returnValue(() => (fn, edata) => edata);
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [
        DsDataService,
        { provide: HttpErrorHandlerService, useValue: heh_spy }
      ]
    });
    service = TestBed.inject(DsDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('server', () => expect(service.server).toBe(server));

  it('category_value', () => {
    expect(category_value(data.categories[0], data.data[0])).toBe(4.5);
    expect(category_value('bog', data.data[1])).toBe(0.0);
  });

  it('getData error', () => {
    service.getData(['1', '2', '3']).subscribe(rdata => {
      expect(rdata.categories).toEqual([]);
      expect(rdata.data).toEqual([]);
    });
    const req = httpMock.expectOne(server);
    expect(req.request.method).toBe('POST');
    req.error(new ErrorEvent('fail'), { status: 404 });
  });

  it('getData error', () => {
    service.getData(['1', '2', '3']).subscribe(edata => {
      expect(edata.categories[0].q1).toEqual(1);
      expect(edata.data[0].id).toEqual('over_outlier');
    });
    const req = httpMock.expectOne(server);
    expect(req.request.method).toBe('POST');
    req.flush(data);
    service.getData(['1', '2', '3']).subscribe(cdata => {
      expect(cdata.categories[0].q1).toEqual(1);
      expect(cdata.data[0].id).toEqual('over_outlier');
    });
  });
});
