import { TestBed } from '@angular/core/testing';

import { TaggedTextService } from './tagged-text.service';

describe('TaggedTextService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TaggedTextService = TestBed.get(TaggedTextService);
    expect(service).toBeTruthy();
  });
});
