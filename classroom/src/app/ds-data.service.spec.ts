import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Spied } from 'src/testing';
import { environment } from './../environments/environment';
import {
  category_value,
  DsDataService,
  genCategoryDataMap,
  max_boxplot_value,
  max_document_data_value,
} from './ds-data.service';
import { HttpErrorHandlerService } from './http-error-handler.service';

const data = {
  categories: [
    {
      q1: 1,
      q2: 2,
      q3: 3,
      min: 0,
      max: 4,
      uifence: 3.5,
      lifence: 0.5,
      id: 'bogus',
      name: 'Bogus Data',
    },
  ],
  data: [
    {
      id: 'over_outlier',
      title: 'High Bogus Outlier',
      bogus: 4.5,
      total_words: 100,
      ownedby: 'student',
    },
    {
      id: 'under_outlier',
      title: 'Low Bogus Outlier',
      bogus: 0.25,
      total_words: 100,
      ownedby: 'student',
    },
    {
      id: 'noutlier',
      title: 'Non-Outlier',
      bogus: 2,
      total_words: 100,
      ownedby: 'instructor',
    },
  ],
};

describe('DsDataService', () => {
  let service: DsDataService;
  let httpMock: HttpTestingController;
  const server = `${environment.backend_server}/ds_data`;

  beforeEach(() => {
    const heh_spy = jasmine.createSpyObj('HttpErrorHandlerService', [
      'createHandleError',
    ]) as Spied<HttpErrorHandlerService>;
    heh_spy.createHandleError.and.returnValue(
      () => (_fn: () => unknown, edata: unknown) => edata
    );
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DsDataService,
        { provide: HttpErrorHandlerService, useValue: heh_spy },
      ],
    });
    service = TestBed.inject(DsDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    void expect(service).toBeTruthy();
  });

  it('server', () => expect(service.server).toBe(server));

  it('DocuScopeData', () => {
    void expect(max_boxplot_value(data)).toEqual(4);
    void expect(max_document_data_value(data)).toEqual(0.25);
    void expect(max_document_data_value({ data: [] })).toEqual(1);
  });
  it('category_value', () => {
    void expect(category_value(data.categories[0], data.data[0])).toBe(4.5);
    void expect(category_value('bog', data.data[1])).toBe(0.0);
    void expect(category_value('ownedby', data.data[1])).toBe(0.0);
  });
  it('genCategoryDataMap', () => {
    // test null data
    void expect(genCategoryDataMap({ data: [] }).size).toBe(0);
  });

  // This causes warning while testing.
  xit('getData error', () => {
    service.getData(['1', '2', '3']).subscribe((rdata) => {
      void expect(rdata.categories).toEqual([]);
      void expect(rdata.data).toEqual([]);
    });
    const req = httpMock.expectOne(server);
    void expect(req.request.method).toBe('POST');
    req.error(new ProgressEvent('fail'), { status: 404 });
  });

  it('getData', () => {
    service.getData(['1', '2', '3']).subscribe((edata) => {
      void expect(edata.categories[0].q1).toEqual(1);
      void expect(edata.data[0].id).toEqual('over_outlier');
    });
    const req = httpMock.expectOne(server);
    void expect(req.request.method).toBe('POST');
    req.flush(data);
    // check caching
    service.getData(['1', '2', '3']).subscribe((cdata) => {
      void expect(cdata.categories[0].q1).toEqual(1);
      void expect(cdata.data[0].id).toEqual('over_outlier');
    });
  });
});
