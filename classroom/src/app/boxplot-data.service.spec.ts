import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { BoxplotDataService } from './boxplot-data.service';
import { environment } from './../environments/environment';

describe('BoxplotDataService', () => {
  let service: BoxplotDataService;
  const corpus = ['1', '2', '3'];
  let httpMock: HttpTestingController;
  const server = environment.backend_server;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, MatSnackBarModule ],
      providers: [ BoxplotDataService ]
    });
    service = TestBed.get(BoxplotDataService);
    httpMock = TestBed.get(HttpTestingController);
  });
  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getBoxPlotData', () => {
    const data = {bpdata: [], outliers: []};
    service.getBoxPlotData(corpus).subscribe(ret => {
      expect(ret).toEqual(data);
    });
    const req = httpMock.expectOne(`${server}/boxplot_data`);
    expect(req.request.method).toBe('POST');
    req.flush(data);

    // check caching
    service.getBoxPlotData(corpus).subscribe(ret => {
      expect(ret).toEqual(data);
    });
  });
  it('getRankedList', () => {
    const data = { result: [] };
    service.getRankedList(corpus, 'x').subscribe(ret => {
      expect(ret).toEqual(data);
    });
    const req = httpMock.expectOne(`${server}/ranked_list`);
    expect(req.request.method).toBe('POST');
    req.flush(data);
    // check caching
    service.getRankedList(corpus, 'x').subscribe(ret => {
      expect(ret).toEqual(data);
    });
  });
  it('getScatterPlotData', () => {
    const data = { axisX: 'x', axisY: 'y', spdata: [] };
    service.getScatterPlotData(corpus, 'x', 'y').subscribe(ret => {
      expect(ret).toEqual(data);
    });
    const req = httpMock.expectOne(`${server}/scatterplot_data`);
    expect(req.request.method).toBe('POST');
    req.flush(data);
    // check caching
    service.getScatterPlotData(corpus, 'x', 'y').subscribe(ret => {
      expect(ret).toEqual(data);
    });
  });
  it('getGroupsData', () => {
    const data = { groups: [[]], grp_qualities: [], quality: 0.0 };
    service.getGroupsData(corpus, 2).subscribe(ret => {
      expect(ret).toEqual(data);
    });
    const req = httpMock.expectOne(`${server}/groups`);
    expect(req.request.method).toBe('POST');
    req.flush(data);
  });
});
