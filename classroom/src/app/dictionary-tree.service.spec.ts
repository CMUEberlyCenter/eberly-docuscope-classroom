import { TestBed } from '@angular/core/testing';

import { DictionaryTreeService } from './dictionary-tree.service';

describe('DictionaryTreeService', () => {
  let service: DictionaryTreeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DictionaryTreeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
