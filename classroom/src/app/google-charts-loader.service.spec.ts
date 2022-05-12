import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { GoogleChartsLoaderService } from './google-charts-loader.service';

describe('GoogleChartsLoaderService', () => {
  let service: GoogleChartsLoaderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(GoogleChartsLoaderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    return expect(service).toBeTruthy();
  });

  it('load', async () => {
    await expect(() => service.load()).not.toThrow();
    //const req = httpMock.expectOne('https://www.gstatic.com/charts/loader.js');
    //await expect(req.request.method).toBe('GET');
    //await expect(async () => await service.load()).not.toThrow();
  });

  /*it('load error', async () => {

  });*/
});
