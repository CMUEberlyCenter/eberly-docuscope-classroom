import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Type } from '@angular/core';

import { DSDictionaryService } from './ds-dictionary.service';

describe('DsDictionaryService', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ DSDictionaryService ]
    });

    httpMock = TestBed.get(HttpTestingController as Type<HttpTestingController>);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    const service: DSDictionaryService = TestBed.get(DSDictionaryService);
    expect(service).toBeTruthy();
  });
});
