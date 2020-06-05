import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { DsDataService } from './ds-data.service';
import { environment } from './../environments/environment';

describe('DsDataService', () => {
  let service: DsDataService;
  const corput = ['1', '2', '3'];
  let httpMock: HttpTestingController;
  const server = environment.backend_server;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, MatSnackBarModule ],
      providers: [ DsDataService ]
    });
    service = TestBed.inject(DsDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
