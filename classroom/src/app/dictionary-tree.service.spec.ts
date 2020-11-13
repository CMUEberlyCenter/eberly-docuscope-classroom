import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatMenuModule } from '@angular/material/menu';

import { DictionaryTreeService } from './dictionary-tree.service';

describe('DictionaryTreeService', () => {
  let service: DictionaryTreeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, MatMenuModule ]
    });
    service = TestBed.inject(DictionaryTreeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
