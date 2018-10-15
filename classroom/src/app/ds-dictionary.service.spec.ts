import { TestBed } from '@angular/core/testing';

import { DsDictionaryService } from './ds-dictionary.service';

describe('DsDictionaryService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DsDictionaryService = TestBed.get(DsDictionaryService);
    expect(service).toBeTruthy();
  });
});
