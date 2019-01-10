import { TestBed } from '@angular/core/testing';

import { DSDictionaryService } from './ds-dictionary.service';

describe('DsDictionaryService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DSDictionaryService = TestBed.get(DSDictionaryService);
    expect(service).toBeTruthy();
  });
});
