import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatMenuModule } from '@angular/material/menu';
import { CommonDictionaryService } from './common-dictionary.service';

describe('CommonDictionaryService', () => {
  let service: CommonDictionaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, MatMenuModule ]
    });
    service = TestBed.inject(CommonDictionaryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
